import { BadRequestException } from '@nestjs/common';
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
    try {
      const data = [];

      const files = await readdir(folderPath);
      const firstFile = files[0];
      const firstFilePath = path.join(folderPath, firstFile);

      const zip = new AdmZip(firstFilePath);
      const zipEntries = zip.getEntries();

      zipEntries.forEach(function (zipEntry) {
        parser.parseString(
          zipEntry.getData().toString('utf8'),
          (err, result) => {
            const dataJson = JSON.stringify(result, null, 2);

            const parsed = JSON.parse(dataJson);

            const [endDest] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['dest'][0]['enderDest'];
            const [cnpjDest] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['dest'][0]['CNPJ'];
            const [cnpjEmit] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['emit'][0]['CNPJ'];
            const [xNome] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['emit'][0]['xNome'];
            const [xFant] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['emit'][0]['xFant'];
            const [xNomeDest] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['dest'][0]['xNome'];
            const [nNF] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['ide'][0]['nNF'];
            const [enderEmit] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['emit'][0]['enderEmit'];
            const [vol] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['transp'][0]['vol'];
            const [vPag] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['pag'][0]['detPag'][0][
                'vPag'
              ];
            const [vLiq] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['cobr'][0]['fat'][0][
                'vLiq'
              ];
            const [xPed] =
              parsed['nfeProc']['NFe'][0]['infNFe'][0]['det'][0]['prod'][0][
                'xPed'
              ] ?? '';
            const nfeId = parsed['nfeProc']['NFe'][0]['infNFe'][0]['$']['Id'];

            const dataNF = {};
            const dest = {};
            const emit = {};
            const endDestFormatted = {};
            const endEmitFormatted = {};
            const volFormatted = {};
            const prod = {};

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

            Object.entries(vol).forEach(
              ([key, [value]]: [string, [string]]) => {
                Object.assign(volFormatted, { [key]: value });
              },
            );

            dataNF['Id'] = nfeId;
            dataNF['nNF'] = nNF;
            dataNF['dest'] = {
              ...dest,
              CNPJ: cnpjDest,
              xNome: xNomeDest,
              enderDest: { ...endDestFormatted },
            };
            dataNF['emit'] = {
              ...emit,
              CNPJ: cnpjEmit,
              xNome,
              xFant,
              enderEmit: { ...endEmitFormatted },
            };
            dataNF['vol'] = { ...volFormatted };
            dataNF['vPag'] = vPag;
            dataNF['vLiq'] = vLiq;
            dataNF['prod'] = {
              ...prod,
              xPed: xPed ? xPed : '',
            };

            data.push(dataNF);
          },
        );
      });

      for (const file of files) {
        await unlink(path.join(folderPath, file));
      }

      return data;
    } catch (err) {
      console.log(err);
      throw new BadRequestException(
        'O sistema está um pouco instavel, tente novamente em alguns minutos!',
      );
    }
  }
}
