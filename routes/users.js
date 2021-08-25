const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// router.get("/", (req, res) => {
//     res.send("users route");
// })

// update user
router.put("/:id", async (req, res)=>{
    if(req.body.userId === req.params.id || req.body.isAdmin){
        if(req.body.password){
            // if user wants to update their password
            try{
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            }catch(err){
                return res.status(500).json(err);
            }
        }
        try{
            const user = await User.findByIdAndUpdate(req.params.id, {
                $set : req.body,
            });

            res.status(200).json("Account update was successful");
        } catch(err){
            return res.status(500).json(err);
        }
    }else{
        return res.status(403).json("You can only update your account");
    }
});

// delete user
router.delete("/:id", async (req, res)=>{
    if(req.body.userId === req.params.id || req.body.isAdmin){
        try{
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Account delete was successful");
        } catch(err){
            return res.status(500).json(err);
        }
    }else{
        return res.status(403).json("You can only delete your account");
    }
});

// get a user
router.get("/", async (req, res) => {
    const userId = req.query.userId;
    const username = req.query.username;
    try{
        const user = userId
        ? await User.findById(userId)
        : await User.findOne({
            username : username
        });
        // extracts password and updatedAt info such that
        // they are not returned from get request
        const {password, updatedAt, ...other} = user._doc;
        res.status(200).json(other);
    }catch(err){
        return res.status(500).json(err);
    }
});

// get a user
router.get("/registered/all", async (req, res) => {
    try{
        const users = await User.find({});

        let userList = []
        users.map(user => {
            const {_id, username, profilePicture} = user;
            userList.push({_id, username, profilePicture});
        });
        // console.log(userList);
        res.status(200).json(userList);
    }catch(err){
        return res.status(500).json(err);
    }
});

// get friends
router.get("/friends/:userId", async (req, res) => {
    try{
        const user = await User.findById(req.params.userId);
        const friends = await Promise.all(
            user.followings.map(
                friendId => {
                    return User.findById(friendId);
                }
            )
        );
        let friendList = []
        friends.map(friend => {
            const {_id, username, profilePicture} = friend;
            friendList.push({_id, username, profilePicture});
        });
        res.status(200).json(friendList);
    }catch(err){
        res.status(500).json(err);
    }
});

// follow a user
router.put("/:id/follow", async (req, res) => {
    // if id doesnt match
    if(req.body.userId !== req.params.id) {
        try{
            const user = await User.findById(req.params.id);
            const currUser = await User.findById(req.body.userId);
            // checks if the user is already followed
            if(!user.followers.includes(req.body.userId)){
                // updates followers
                await user.updateOne({
                    $push:{
                        followers : req.body.userId
                    }
                });
                // updates following
                await currUser.updateOne({
                    $push:{
                        followings : req.params.id
                    }
                });
                res.status(200).json("User has been followed");
            }else{
                res.status(403).json("You already follow this user");
            }
        }catch(err){
            res.status(500).json(err);
        }
    }else{
        res.status(403).json("You can't follow yourself");
    }
});

// unfollow a user
router.put("/:id/unfollow", async (req, res) => {
    // if id doesnt match
    if(req.body.userId !== req.params.id) {
        try{
            const user = await User.findById(req.params.id);
            const currUser = await User.findById(req.body.userId);
            // checks if the user is already unfollowed
            if(user.followers.includes(req.body.userId)){
                // updates followers
                await user.updateOne({
                    $pull:{
                        followers : req.body.userId
                    }
                });
                // updates following
                await currUser.updateOne({
                    $pull:{
                        followings : req.params.id
                    }
                });
                res.status(200).json("User has been unfollowed");
            }else{
                res.status(403).json("You already unfollow this user");
            }
        }catch(err){
            res.status(500).json(err);
        }
    }else{
        res.status(403).json("You can't follow yourself");
    }
});

module.exports = router;