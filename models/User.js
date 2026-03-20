const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_WORK_FACTOR = 10;

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Student', 'Admin'],
    default: 'Student'
  },
  profilePic: { type: String, default: '/img/def_avatar.jpg' },
  description: { type: String, default: '' }
});

// password hashing middleware
userSchema.pre('save', async function(){
    const user = this;

    if(!user.isModified('password')) return; // check if new or modified

    try{
        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        const hash = await bcrypt.hash(user.password, salt);

        user.password = hash;
    } catch(err){
        console.error(err);
        throw err;
    }
});

userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);