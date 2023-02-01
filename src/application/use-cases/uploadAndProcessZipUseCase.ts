/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
const util = require('util');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, '..', '..', '..', 'upload');

const parser = new xml2js.Parser();

const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

@Injectable()
export class UploadAndProcessZipUseCase {
  async execute() {
    const data = [];

    const files = await readdir(folderPath);
    const firstFile = files[0];
    const firstFilePath = path.join(folderPath, firstFile);

    const zip = new AdmZip(firstFilePath);
    const zipEntries = zip.getEntries();

    zipEntries.forEach(function (zipEntry) {
      parser.parseString(zipEntry.getData().toString('utf8'), (err, result) => {
        const dataJson = JSON.stringify(result, null, 2);

        const parsed = JSON.parse(dataJson);

        const [endDest] =
          parsed['nfeProc']['NFe'][0]['infNFe'][0]['dest'][0]['enderDest'];
        const [cnpjDest] =
          parsed['nfeProc']['NFe'][0]['infNFe'][0]['dest'][0]['CNPJ'];
        const [cnpjEmit] =
          parsed['nfeProc']['NFe'][0]['infNFe'][0]['emit'][0]['CNPJ'];
        const [nNF] = parsed['nfeProc']['NFe'][0]['infNFe'][0]['ide'][0]['nNF'];
        const [enderEmit] =
          parsed['nfeProc']['NFe'][0]['infNFe'][0]['emit'][0]['enderEmit'];
        const [vol] =
          parsed['nfeProc']['NFe'][0]['infNFe'][0]['transp'][0]['vol'];
        const [vPag] =
          parsed['nfeProc']['NFe'][0]['infNFe'][0]['pag'][0]['detPag'][0][
            'vPag'
          ];
        // console.log(cnpjDest)

        const nfeId = parsed['nfeProc']['NFe'][0]['infNFe'][0]['$']['Id'];

        const dataNF = {};
        const dest = {};
        const emit = {};
        const endDestFormatted = {};
        const endEmitFormatted = {};
        const volFormatted = {};

        Object.entries(endDest).forEach(
          ([key, [value]]: [string, [string]]) => {
            Object.assign(endDestFormatted, { [key]: value });
          },
        );

        Object.entries(enderEmit).forEach(
          ([key, [value]]: [string, [string]]) => {
            Object.assign(endEmitFormatted, { [key]: value });
          },
        );

        Object.entries(vol).forEach(([key, [value]]: [string, [string]]) => {
          Object.assign(volFormatted, { [key]: value });
        });

        dataNF['Id'] = nfeId;
        dataNF['nNF'] = nNF;
        dataNF['dest'] = {
          ...dest,
          CNPJ: cnpjDest,
          enderDest: { ...endDestFormatted },
        };
        dataNF['emit'] = {
          ...emit,
          CNPJ: cnpjEmit,
          enderEmit: { ...endEmitFormatted },
        };
        dataNF['vol'] = { ...volFormatted };
        dataNF['vPag'] = vPag;

        data.push(dataNF);
      });
    });

    await unlink(firstFilePath);

    return data;
  }
}
