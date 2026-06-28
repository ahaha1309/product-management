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
      serverSelectionTimeoutMS: 5000, // Timeout sau 5s thay vì 30s để tránh Vercel 504
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
