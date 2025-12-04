import express from "express";
import {
  getUserData,
  getAllUsers,
  updateProfile,
  changePassword,
  updateNotifications,
  inviteUser,
  updateUserRole,
  heartbeat,
  submitRating,
  getMyRating,
} from "../controllers/userController.js";
import userAuth from "../middleware/userAuth.js";

const userRouter = express.Router();

// All routes require authentication
userRouter.use(userAuth);

userRouter.post("/get-user-data", getUserData);
userRouter.get("/all", getAllUsers);
userRouter.put("/profile", updateProfile);
userRouter.put("/password", changePassword);
userRouter.put("/notifications", updateNotifications);
userRouter.post("/invite", inviteUser);
userRouter.post("/heartbeat", heartbeat);
userRouter.put("/:userId/role", updateUserRole);

// Rating routes
userRouter.post("/rating", submitRating);
userRouter.get("/rating", getMyRating);

export default userRouter;
