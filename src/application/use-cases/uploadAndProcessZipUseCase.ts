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

        const nfeId = parsed['nfeProc']['NFe'][0]['infNFe'][0]['$']['Id'];

        const endDestFormatted = {};

        Object.entries(endDest).forEach(
          ([key, [value]]: [string, [string]]) => {
            Object.assign(endDestFormatted, { [key]: value });
          },
        );

        endDestFormatted['Id'] = nfeId;

        data.push(endDestFormatted);
      });
    });

    await unlink(firstFilePath);

    return data;
  }
}
