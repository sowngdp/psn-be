'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DOCUMENT_NAME = 'Chat';
const COLLECTION_NAME = 'chats';

const chatSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    context: {
        type: String,
        default: 'fashion-styling'
    },
    metadata: {
        lastInteraction: {
            type: Date,
            default: Date.now
        },
        messageCount: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

// Indexes for better query performance
chatSchema.index({ 'metadata.lastInteraction': -1 });
chatSchema.index({ createdAt: -1 });

// Pre-save middleware to update metadata
chatSchema.pre('save', function (next) {
    if (this.isModified('messages')) {
        this.metadata.messageCount = this.messages.length;
        this.metadata.lastInteraction = new Date();
    }
    next();
});

// Methods
chatSchema.methods.addMessage = function (role, content) {
    this.messages.push({
        role,
        content,
        timestamp: new Date()
    });
    return this.save();
};

chatSchema.methods.clearHistory = function () {
    this.messages = [];
    this.metadata.messageCount = 0;
    return this.save();
};

// Static methods
chatSchema.statics.createNewChat = async function (userId) {
    return this.create({
        userId,
        messages: [],
        metadata: {
            messageCount: 0,
            lastInteraction: new Date()
        }
    });
};

chatSchema.statics.findActiveChats = function (userId) {
    return this.find({
        userId,
        'metadata.lastInteraction': {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
    }).sort({ 'metadata.lastInteraction': -1 });
};

// Export the model
module.exports = mongoose.model(DOCUMENT_NAME, chatSchema);
