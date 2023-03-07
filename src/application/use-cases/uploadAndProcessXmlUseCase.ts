import { BadRequestException } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
const util = require('util');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');

const folderPath = path.join(__dirname, '..', '..', '..', 'upload');

const parser = new xml2js.Parser();

const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

const readFileAsync = util.promisify(fs.readFile);

@Injectable()
export class UploadAndProcessXmlUseCase {
  async execute(file: any) {
    const files = await fs.promises.readdir(folderPath);

    const data = [];

    const firstFile = files[0];
    const firstFilePath = path.join(folderPath, firstFile);

    const fileContent = await readFileAsync(firstFilePath);
    const xmlParser = new xml2js.Parser({ explicitArray: false });
    const json = await xmlParser.parseStringPromise(fileContent);

    try {
      const dataJson = JSON.stringify(json, null, 2);

      const parsed = JSON.parse(dataJson);

      const endDest = parsed['nfeProc']['NFe']['infNFe']['dest']['enderDest'];
      const cnpjDest = parsed['nfeProc']['NFe']['infNFe']['dest']['CNPJ'];
      const cnpjEmit = parsed['nfeProc']['NFe']['infNFe']['emit']['CNPJ'];
      const xNome = parsed['nfeProc']['NFe']['infNFe']['emit']['xNome'];
      const xFant = parsed['nfeProc']['NFe']['infNFe']['emit']['xFant'];
      const xNomeDest = parsed['nfeProc']['NFe']['infNFe']['dest']['xNome'];
      const nNF = parsed['nfeProc']['NFe']['infNFe']['ide']['nNF'];
      const enderEmit = parsed['nfeProc']['NFe']['infNFe']['emit']['enderEmit'];
      const vol = parsed['nfeProc']['NFe']['infNFe']['transp']['vol'];
      const vPag = parsed['nfeProc']['NFe']['infNFe']['pag']['detPag']['vPag'];
      const vLiq = parsed['nfeProc']['NFe']['infNFe']['cobr']['fat']['vLiq'];
      const xPed =
        parsed['nfeProc']['NFe']['infNFe']['det']['prod']['xPed'] ?? '';
      const nfeId = parsed['nfeProc']['NFe']['infNFe']['$']['Id'];
      const vProd =
        parsed['nfeProc']['NFe']['infNFe']['total']['ICMSTot']['vProd'];
      const vNF = parsed['nfeProc']['NFe']['infNFe']['total']['ICMSTot']['vNF'];
      const dhEmi = parsed['nfeProc']['NFe']['infNFe']['ide']['dhEmi'];
      const dataNF = {};
      const dest = {};
      const emit = {};
      const prod = {};

      console.log(dataNF);

      dataNF['Id'] = nfeId;
      dataNF['nNF'] = nNF;
      dataNF['dest'] = {
        ...dest,
        CNPJ: cnpjDest,
        xNome: xNomeDest,
        enderDest: { ...endDest },
      };
      dataNF['emit'] = {
        ...emit,
        CNPJ: cnpjEmit,
        xNome,
        xFant,
        enderEmit: { ...enderEmit },
      };
      dataNF['vol'] = { ...vol };
      dataNF['vPag'] = vNF;
      dataNF['vLiq'] = vProd;
      dataNF['prod'] = {
        ...prod,
        xPed: xPed ? xPed : '',
      };
      dataNF['dhEmi'] = dhEmi;

      data.push(dataNF);
    } catch (err) {
      throw new BadRequestException(
        'Há algum arquivo na lista diferente do tipo de arquivo xml',
      );
    }

    for (const file of files) {
      await unlink(path.join(folderPath, file));
    }

    return data;
  }
}
