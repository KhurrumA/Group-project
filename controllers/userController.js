const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const functionFactory = require("./functionHandler");
const Course = require("../models/courseModel");
const appError = require("../utils/appError");
const mongoose = require("mongoose");

exports.getUser = functionFactory.getOne(User);

// Enroll user in a course
exports.enrollMe = catchAsync(async (req, res, next) => {
  const courseId = req.params.courseId; //getting it from the url
  const { user } = req; //getting it from the req
  const userId = user._id;

  const course = await Course.findById(courseId);

  if (!course) {
    return next(new appError("Course not found", 404));
  }

  const isEnrolled = course.users.some(
    (userId) => userId.toString() === userId.toString()
  );

  //Check if the user is already enrolled in the course
  if (isEnrolled) {
    return next(new appError("You are already enrolled in this course", 400));
  }

  //if not enrolled and the couse exists --> enroll user
  course.users.push(user._id);
  await course.save();
  res.status(201).json({ status: "success", data: { course } });
});
// Get courses enrolled by user
exports.getUserCourses = catchAsync(async (req, res, next) => {
  const { user } = req;
  console.log(user);
  // Find all courses where the user is enrolled
  const courses = await Course.find({ users: user._id });

  res.status(200).json({ status: "success", data: { courses } });
});
//ADDING FRIENDS
exports.addFriend = catchAsync(async (req, res, next) => {
  const friendId = req.params.friendId; // Getting the friend's ID from the URL
  const userId = req.user._id; // Getting the current user's ID from the request object

  // Prevent users from adding themselves as a friend
  if (friendId === userId.toString()) {
    return next(new appError("You cannot add yourself as a friend", 400));
  }

  // Check if the friendId is valid
  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    return next(new appError("Invalid friend ID", 400));
  }

  // Check if the friend to add exists
  const friendExists = await User.findById(friendId);
  if (!friendExists) {
    return next(new appError("Friend not found", 404));
  }

  // Check if the user is already a friend
  const user = await User.findById(userId);
  const isAlreadyFriend = user.friends.some(
    (friend) => friend.toString() === friendId
  );
  if (isAlreadyFriend) {
    return next(new appError("This user is already your friend", 400));
  }

  // Add friend to the user's friends list
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { friends: friendId } }, // $addToSet adds a value to an array unless the value is already present
    { new: true }
  );
  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user._id,
        name: user.name,
        friends: user.friends, // This will return the updated list of friends
      },
    },
  });
});

//GET ANALYTICS: Total student, started, completed
exports.analytics = catchAsync(async (req, res, next) => {
  const courseId = req.params.courseId; //getting the course ID
  const course = await Course.findById(courseId); //getting the course
  const totUser = course.users.length; //total enrolled students in that course

  //STUDENTS WHO STARTED THE COURSE
  const totStart = await Progress.countDocuments(courseId);
  console.log(totStart);

  //STUDENTS WHO COMPLETED THE COURSE
  console.log("This is the couseId", courseId);
  //counts the document that have got the timeCompleted field
  const totCompleted = await Progress.countDocuments({
    timeCompleted: { $exists: true },
    course: mongoose.Types.ObjectId(courseId),
  });
  console.log(totCompleted);

  if (totUser == 0 && totCompleted == 0 && totStart == 0) {
    return res.status(200).json({ status: "success", data: 0 });
  } else {
    return res
      .status(200)
      .json({ status: "success", data: { totUser, totCompleted, totStart } });
  }
});
