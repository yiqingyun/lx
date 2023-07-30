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
                name: "Alice",
                points: "50",
                level: "1",
                lastShared: toString(Date.now())
            },
            {
                name: "Bob",
                points: "50",
                level: "1",
                lastShared: toString(Date.now())
            },
            {
                name: "Charlie",
                points: "50",
                level: "1",
                lastShared: toString(Date.now())
            },
            {
                name: "Dave",
                points: "50",
                level: "1",
                lastShared: toString(Date.now())
            }
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.name, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }







 async sharePoints(ctx, name) {
        // 检查传入的成员是否存在
        const memberAsBytes = await ctx.stub.getState(name);
        if (!memberAsBytes || memberAsBytes.length === 0) {
            throw new Error(`name ${name} does not exist.`);
        }

        // 更新最后一次共享时间
        const memberObj = JSON.parse(memberAsBytes.toString());
        const currentTime = Date.now();
        memberObj.lastShared = currentTime;

        // 将该成员的等级和共享积分计算出来
        const timeDiff = (currentTime - memberObj.lastShared) / (1000 * 60 * 60 * 24);
        memberObj.level = Math.floor(memberObj.points / 10) + (timeDiff > 7 ? -1 : 0);
        const sharePoints = Math.floor(Math.pow(memberObj.level, 2) / 2);

        // 更新该成员的积分
        memberObj.points += sharePoints;

        // 保存更新后的成员信息
        await ctx.stub.putState(name, Buffer.from(JSON.stringify(memberObj)));

        return `name ${name} shared ${sharePoints} points, new total points: ${memberObj.points}`;
    }

    async penalizeMember(ctx, name) {
        // 检查传入的成员是否存在
        const memberAsBytes = await ctx.stub.getState(name);
        if (!memberAsBytes || memberAsBytes.length === 0) {
            throw new Error(`name ${name} does not exist.`);
        }

        // 计算扣除的积分
        const memberObj = JSON.parse(memberAsBytes.toString());
        const timeDiff = (Date.now() - memberObj.lastShared) / (1000 * 60 * 60 * 24);
        const penaltyPoints = Math.floor(memberObj.points * (timeDiff > 30 ? 0.2 : 0.1));

        // 扣除该成员的积分
        memberObj.points -= penaltyPoints;

        // 更新该成员的信息
        await ctx.stub.putState(name, Buffer.from(JSON.stringify(memberObj)));

        return `name ${name} penalized ${penaltyPoints} points, new total points: ${memberObj.points}`;
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
