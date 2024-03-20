const Course = require("../models/courseModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Progress = require("../models/progressModel");

exports.dashboard = catchAsync(async (req, res, next) => {
  //1) GET course DATA FROM COLLECTION
  const userId = req.user._id;

  const courses = await Course.find({ users: userId }).populate("users");
  console.log(courses._id);
  const progress = await Progress.find({
    user: userId,
  });

  //all course data will retrieved and passed to the template
  res.status(200).render("dashboard", {
    title: "Dashboard",
    courses,
    progress,
  });
});

exports.getCourses = catchAsync(async (req, res, next) => {
  const courses = await Course.find();
  const topCourses = await Course.aggregate([
    {
      $project: {
        name: 1, // Include the name
        summary: 1, // Include the summary
        imageCover: 1, // Include the picture
        coursePoints: 1, // Include the points
        numberOfUsers: { $size: "$users" }, // Count the number of users enrolled
      },
    },
    { $sort: { numberOfUsers: -1 } }, // Sort by numberOfUsers in descending order
    { $limit: 3 }, // Limit to top 3
  ]);

  res
    .status(200)
    .render("courses", { title: "All courses", courses, topCourses });
});

exports.getCourse = catchAsync(async (req, res, next) => {
  //1) GET THE DATA including reviews and users
  const course = await Course.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });
  //NO COURSE ERROR HANDLING
  if (!course) {
    return next(new AppError("There is no course with that name", 404));
  }
  //2) BUILD TEMPLATE

  //3) RENDER TEMPLATE USING THE DATA FROM STEP 1
  res.status(200).render("course", {
    title: `${course.name} Course`,
    course,
  });
});

exports.getLoginForm = (req, res) => {
  console.log("I am in view controller");
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render("register", {
    title: "Register Now",
  });
};

exports.getLanding = (req, res) => {
  res.status(200).render("landing", {
    title: "Welcome",
  });
};

exports.postReview = catchAsync(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug });
  res.status(200).render("review", {
    title: "Review",
    course,
  });
});

exports.getCourseOverview = catchAsync(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug });
  res.status(200).render("ibmCourse", {
    title: course.name,
    course,
  });
});

//Get user account
exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

exports.getUploadPhoto = (req, res) => {
  res.status(200).render("updatePicture", {
    title: "Update Picture",
  });
};

// exports.uploadPhoto = catchAsync(async (req, res) => {
//   console.log(" i am in upload views");
//   console.log(req);
//   const user = req.user._id;
//   console.log(user);
//   const updatedUser = await User.findByIdAndUpdate(user, {
//     photo: req.params.photo,
//   });
//   console.log(updatedUser);
//   res.status(200).render("updatePicture", {
//     title: "Upload Picture",
//     user: updatedUser,
//   });
// });

exports.uploadPhoto = catchAsync(async (req, res) => {
  console.log(req);
  // Assuming 'photo' is the name of your file input field and multer is set up correctly
  if (req.file) {
    const user = req.user._id;
    const updatedUser = await User.findByIdAndUpdate(
      user,
      {
        photo: req.file.filename, // Use the filename from the uploaded file
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).render("updatePicture", {
      title: "Upload Picture",
      user: updatedUser,
    });
  } else {
    // Handle the case where no file was uploaded
    res.status(400).send("No file uploaded.");
  }
});
