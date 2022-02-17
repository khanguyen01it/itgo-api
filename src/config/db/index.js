const mongoose = require('mongoose');

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connect Successfully!!!');
    }
    catch (error) {
        console.log(error);
    }
}

module.exports = { connect };