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
    const files = await readdir(folderPath);
    try {
      const data = [];

      const firstFile = files[0];
      const firstFilePath = path.join(folderPath, firstFile);

      const zip = new AdmZip(firstFilePath);
      const zipEntries = zip.getEntries();

      zipEntries.forEach(function (zipEntry) {
        try {
          parser.parseString(
            zipEntry.getData().toString('utf8'),
            (err, result) => {
              try {
                const dataJson = JSON.stringify(result, null, 2);

                const parsed = JSON.parse(dataJson);

                const [endDest] =
                  parsed['nfeProc']['NFe'][0]['infNFe'][0]['dest'][0][
                    'enderDest'
                  ];
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
                  parsed['nfeProc']['NFe'][0]['infNFe'][0]['emit'][0][
                    'enderEmit'
                  ];
                const [vol] =
                  parsed['nfeProc']['NFe'][0]['infNFe'][0]['transp'][0]['vol'];

                console.log(parsed['nfeProc']['NFe'][0]['infNFe'][0]['cobr']);
                const [xPed] =
                  parsed['nfeProc']['NFe'][0]['infNFe'][0]['det'][0]['prod'][0][
                    'xPed'
                  ] ?? '';
                const nfeId =
                  parsed['nfeProc']['NFe'][0]['infNFe'][0]['$']['Id'];

                const [vProd] =
                  parsed['nfeProc']['NFe'][0]['infNFe'][0]['total'][0][
                    'ICMSTot'
                  ][0]['vProd'];
                const [vNF] =
                  parsed['nfeProc']['NFe'][0]['infNFe'][0]['total'][0][
                    'ICMSTot'
                  ][0]['vNF'];

                const [dhEmi] =
                  parsed['nfeProc']['NFe'][0]['infNFe'][0]['ide'][0]['dhEmi'];

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
                dataNF['vPag'] = vNF;
                dataNF['vLiq'] = vProd;
                dataNF['prod'] = {
                  ...prod,
                  xPed: xPed ? xPed : '',
                };
                dataNF['dhEmi'] = dhEmi;

                data.push(dataNF);
              } catch (err) {
                console.log(err);
                throw new BadRequestException(
                  'Há algum arquivo na lista diferente do tipo de arquivo xml',
                );
              }
            },
          );
        } catch (err) {
          console.log(err);
          throw new BadRequestException(
            'Há algum arquivo na lista diferente do tipo de arquivo xml',
          );
        }
      });

      for (const file of files) {
        await unlink(path.join(folderPath, file));
      }

      return data;
    } catch (err) {
      // console.log(err);
      throw new BadRequestException(
        'O sistema está um pouco instavel, tente novamente em alguns minutos!',
      );
    } finally {
      const unlinkPromises = files.map((file) =>
        unlink(path.join(folderPath, file)),
      );
      Promise.all(unlinkPromises)
        .then(() => {
          console.log('Todos os arquivos foram excluídos com sucesso!');
        })
        .catch((error) => {
          // console.error('Erro ao excluir arquivos:', error);
        });
    }
  }
}
