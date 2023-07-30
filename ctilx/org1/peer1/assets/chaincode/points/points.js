'use strict';

const { Contract } = require('fabric-contract-api');

class MyContract extends Contract {

    async initLedger(ctx) {
        // 初始化时，为每个成员创建一个初始积分，并将其存储在账本中
        const members = [
            {
                name: 'Alice',
                points: 50,
                level: 1,
                lastShared: Date.now()
            },
            {
                name: 'Bob',
                points: 40,
                level: 1,
                lastShared: Date.now()
            },
            {
                name: 'Charlie',
                points: 30,
                level: 1,
                lastShared: Date.now()
            },
            {
                name: 'Dave',
                points: 20,
                level: 1,
                lastShared: Date.now()
            }
        ];

        for (let i = 0; i < members.length; i++) {
            await ctx.stub.putState(members[i].name, Buffer.from(JSON.stringify(members[i])));
        }
    }

    async sharePoints(ctx, member) {
        // 检查传入的成员是否存在
        const memberAsBytes = await ctx.stub.getState(member);
        if (!memberAsBytes || memberAsBytes.length === 0) {
            throw new Error(`Member ${member} does not exist.`);
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
        await ctx.stub.putState(member, Buffer.from(JSON.stringify(memberObj)));

        return `Member ${member} shared ${sharePoints} points, new total points: ${memberObj.points}`;
    }

    async penalizeMember(ctx, member) {
        // 检查传入的成员是否存在
        const memberAsBytes = await ctx.stub.getState(member);
        if (!memberAsBytes || memberAsBytes.length === 0) {
            throw new Error(`Member ${member} does not exist.`);
        }

        // 计算扣除的积分
        const memberObj = JSON.parse(memberAsBytes.toString());
        const timeDiff = (Date.now() - memberObj.lastShared) / (1000 * 60 * 60 * 24);
        const penaltyPoints = Math.floor(memberObj.points * (timeDiff > 30 ? 0.2 : 0.1));

        // 扣除该成员的积分
        memberObj.points -= penaltyPoints;

        // 更新该成员的信息
        await ctx.stub.putState(member, Buffer.from(JSON.stringify(memberObj)));

        return `Member ${member} penalized ${penaltyPoints} points, new total points: ${memberObj.points}`;
    }

}
module.exports = MyContract;