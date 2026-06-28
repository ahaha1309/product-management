const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

module.exports.connect = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Tối ưu cho Serverless
    };

    cached.promise = mongoose.connect(process.env.MONGO_URL, opts).then((mongoose) => {
      console.log('Connect success (Serverless Caching)');
      return mongoose;
    }).catch(e => {
        console.log('Connect error');
        throw e;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};
