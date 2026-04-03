import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
} from '../controllers/user.controller.js';

import { protect, blockSelfAction, guardLastAdmin } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import {
  validate,
  createUserRules,
  updateUserRules,
  objectIdRule,
} from '../middleware/validate.middleware.js';
import { CAN_MANAGE } from '../constants/roles.js';

const router = express.Router();

// All user management routes require auth + admin role
router.use(protect);
router.use(authorize(...CAN_MANAGE));

router.get('/',     getAllUsers);
router.get('/:id',  objectIdRule('id'), validate, getUserById);

router.post('/',    createUserRules,                            validate, createUser);

router.patch(
  '/:id',
  objectIdRule('id'),
  validate,
  blockSelfAction,     // ← admin can't modify themselves here
  guardLastAdmin,      // ← can't demote/deactivate last admin
  updateUserRules,
  validate,
  updateUser
);

router.delete(
  '/:id',
  objectIdRule('id'),
  validate,
  blockSelfAction,     // ← admin can't deactivate themselves
  guardLastAdmin,      // ← can't deactivate last admin
  deactivateUser
);

export default router;