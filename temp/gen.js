import mongoose from 'mongoose';
import instanceMongodb from '../src/configs/database';
import {  } from '../src/services/gen-outfit';
import itemModel from '../src/db/models/item.model';
instanceMongodb;
console.log(mongoose.connection.readyState)

// await Service.genEmbeddingForAllItem();

// await generateOutfitRecommendation("682e0894daa69841e26ef77b");

const itemIds =['6849331c638891ece86360ab','684933a7638891ece86360af']
const items = await itemModel.find({ _id: { $in: itemIds } }).lean();

// console.log(await getAllUserRecommendations('682e0894daa69841e26ef77b'));
await generateImageForAllRecommendations();