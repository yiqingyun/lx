/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
              type: "malware",
              spec_version: "2.1",
              id: "malware--e1e3c222-1f17-42c7-819d-44a93c38e6a5",
              created: "2020-08-01T00:00:00.000Z",
              name: "WannaCry",
              description: "ransomware"
            },
            {
              type: "threat-actor",
              spec_version: "2.1",
              id: "threat-actor--4a564746-2f0f-44dc-ab52-1da1c64069a7",
              created: "2020-08-01T00:00:00.000Z",
              name: "APT28",
              description: "Fancy Bear"
            },
            {
              type: "attack-pattern",
              spec_version: "2.1",
              id: "attack-pattern--9e5307f1-2dca-4ebb-b6d5-91b307b31d48",
              created: "2020-08-01T00:00:00.000Z",
              name: "Spearphishing Attachment",
              description: "Sending a spearphishing attachment to an individual or group in order to gain access to their system"
            },
            {
              type: "indicator",
              spec_version: "2.1",
              id: "indicator--1d9cb746-4e8e-4b9c-aaee-d172d9aa8b2c",
              created: "2020-08-01T00:00:00.000Z",
              name: "Malicious Domain",
              description: "This domain is known to host malware"
            },
            {
              type: "indicator",
              spec_version: "2.1",
              id: "indicator--6a5c8b63-bada-4e71-b6c5-4fdf6b005964",
              created: "2020-08-01T00:00:00.000Z",
              name: "Malware Hash",
              description: "This hash is associated with a known malware variant"
            },
            {
              type: "tool",
              spec_version: "2.1",
              id: "tool--623b2d75-2c08-4c25-bf6b-3f9ebd75472d",
              created: "2020-08-01T00:00:00.000Z",
              name: "Metasploit",
              description: "exploit"
            },
            {
              type: "vulnerability",
              spec_version: "2.1",
              id: "vulnerability--f806a9f0-2bde-4451-9d00-63caf36afc6a",
              created: "2020-08-01T00:00:00.000Z",
              name: "CVE-2020-12345",
              description: "A security vulnerability in a software component"
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, type, spec_version, created, name,description) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
              type: type,
              spec_version: spec_version,
              id: id,
              created: created,
              name: name,
              description: description,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, type, spec_version, created, name,description) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const asset = {
              type: type,
              spec_version: spec_version,
              id: id,
              created: created,
              name: name,
              description: description,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }


    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
