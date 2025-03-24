'use strict';

const keyTokenModel = require("../models/keyToken.model");
const { Types } = require('mongoose');

class KeyTokenService {
    static createKeyToken = async ({ userId, publicKey, privateKey, refreshToken }) => {
        try {
            // Nếu đã tồn tại tokens cho user này thì xóa và tạo mới
            const existingKey = await keyTokenModel.findOneAndDelete({ user: userId });

            // Tạo mới
            const newKeyToken = await keyTokenModel.create({
                user: userId,
                publicKey,
                privateKey,
                refreshTokensUsed: [],
                refreshToken
            });

            return newKeyToken ? newKeyToken.publicKey : null;
        } catch (error) {
            return error;
        }
    }

    static findByUserId = async (userId) => {
        return await keyTokenModel.findOne({ user: new Types.ObjectId(userId) });
    }

    static findByRefreshToken = async (refreshToken) => {
        return await keyTokenModel.findOne({ refreshToken });
    }

    static updateRefreshToken = async (userId, token) => {
        return await keyTokenModel.findOneAndUpdate(
            {
                user: new Types.ObjectId(userId)
            },
            {
                refreshToken: token
            },
            {
                new: true
            }
        );
    }

    static markTokenAsUsed = async (userId, token) => {
        return await keyTokenModel.findOneAndUpdate(
            {
                user: new Types.ObjectId(userId)
            },
            {
                $push: { refreshTokensUsed: token }
            },
            {
                new: true
            }
        );
    }

    static removeTokenByUserId = async (userId) => {
        return await keyTokenModel.findOneAndDelete({
            user: new Types.ObjectId(userId)
        });
    }

    static findByRefreshTokenUsed = async (refreshToken) => {
        return await keyTokenModel.findOne({ refreshTokensUsed: refreshToken });
    }
};

module.exports = KeyTokenService;