const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user.model');
const generate = require('../helper/generate');

// ===== GOOGLE STRATEGY =====
const GOOGLE_READY = 
  process.env.GOOGLE_CLIENT_ID && 
  !process.env.GOOGLE_CLIENT_ID.startsWith('PASTE_');

const FACEBOOK_READY = 
  process.env.FACEBOOK_APP_ID && 
  !process.env.FACEBOOK_APP_ID.startsWith('PASTE_');

if (GOOGLE_READY) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0]?.value;
      const avatar = profile.photos && profile.photos[0]?.value;

      let user = await User.findOne({ email, deleted: false });

      if (user) {
        if (!user.avatar && avatar) {
          user.avatar = avatar;
          await user.save();
        }
        return done(null, user);
      }

      user = await User.create({
        fullName: profile.displayName || email,
        email,
        avatar,
        status: 'active',
        deleted: false,
        token: generate.generateToken(20),
        password: generate.generateToken(16),
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠️  Google OAuth chưa được cấu hình. Điền GOOGLE_CLIENT_ID vào .env');
}

// ===== FACEBOOK STRATEGY =====
if (FACEBOOK_READY) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'picture.type(large)'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0]?.value;
      const avatar = profile.photos && profile.photos[0]?.value;
      const fallbackEmail = email || `fb_${profile.id}@facebook.daca.local`;

      let user = await User.findOne({ email: fallbackEmail, deleted: false });

      if (user) {
        if (!user.avatar && avatar) {
          user.avatar = avatar;
          await user.save();
        }
        return done(null, user);
      }

      user = await User.create({
        fullName: profile.displayName || 'Facebook User',
        email: fallbackEmail,
        avatar,
        status: 'active',
        deleted: false,
        token: generate.generateToken(20),
        password: generate.generateToken(16),
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠️  Facebook OAuth chưa được cấu hình. Điền FACEBOOK_APP_ID vào .env');
}

// Serialize/deserialize
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;

