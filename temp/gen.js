import mongoose from 'mongoose';
import instanceMongodb from '../src/configs/database';
import {  } from '../src/services/gen-outfit';
import itemModel from '../src/db/models/item.model';
import recommendationModel from '../src/db/models/recommendation.model';
import ItemService from '../src/services/item.service';
import app from '../src/app';
import { generateOutfitRecommendation,genEmbeddingForAllRecommendations,getAllUserRecommendations } from '../src/services/gen-outfit';
instanceMongodb;

// await genEmbeddingForAllRecommendations();
// move item and recommendation of 682e0894daa69841e26ef77b to 684ece06eff632fa15bbc147
// console.log(mongoose.connection.readyState)
console.log('Mongoose connection state:', mongoose.connection.readyState);



// await generateOutfitRecommendation("684ece06eff632fa15bbc147");
console.log(await getAllUserRecommendations('684ece06eff632fa15bbc147'));
// const itemIds =['6849331c638891ece86360ab','684933a7638891ece86360af']
// const items = await itemModel.find({ _id: { $in: itemIds } }).lean();

// // console.log(await getAllUserRecommendations('682e0894daa69841e26ef77b'));
// await generateImageForAllRecommendations();