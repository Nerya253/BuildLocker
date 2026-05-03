/* src/middleware/validation.js */
import Joi from 'joi';

/* ============================================================
   Validate Request Middleware
   ============================================================ */

export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      return res.status(400).json({
        ok: false,
        error: 'Validation Error',
        details: error.details.map((detail) => detail.message.replace(/"/g, '')),
      });
    }

    req[source] = value;

    return next();
  };
};

/* ============================================================
   Common Rules
   ============================================================ */

const common = {
  userId: Joi.string()
    .pattern(/^\d{9}$/)
    .required(),

  optionalUserId: Joi.string()
    .pattern(/^\d{9}$/)
    .allow(null, ''),

  email: Joi.string().email().lowercase().trim(),

  phone: Joi.string().pattern(/^(?:\+972|0)\d{8,9}$/),

  name: Joi.string().min(2).max(100).trim(),

  id: Joi.number().integer().positive(),

  dateIso: Joi.date().iso(),

  pagination: {
    limit: Joi.number().integer().min(1).max(500).default(100),
    offset: Joi.number().integer().min(0).default(0),
  },
};

/* ============================================================
   Schemas
   ============================================================ */

export const Schemas = {
  /* Auth */

  login: Joi.object({
    email: common.email.required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: common.email.required(),
  }),

  /* Users */

  createUser: Joi.object({
    user_id: common.userId,
    full_name: common.name.required(),
    email: common.email.required(),
    phone: common.phone.required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('manager', 'user').optional(),
    building_id: common.id.allow(null).optional(),
  }),

  updateMe: Joi.object({
    full_name: common.name.optional(),
    phone: common.phone.optional(),
  }).min(1),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).required(),
  }),

  updateUserStatus: Joi.object({
    is_active: Joi.boolean().required(),
  }),

  transferUserBuilding: Joi.object({
    building_id: common.id.allow(null).required(),
  }),

  /* Buildings */

  createBuilding: Joi.object({
    name: common.name.required(),
    city: Joi.string().min(2).max(100).trim().required(),
    address: Joi.string().min(2).max(150).trim().required(),
    manager_id: common.optionalUserId.optional(),
  }),

  updateBuilding: Joi.object({
    name: common.name.optional(),
    city: Joi.string().min(2).max(100).trim().optional(),
    address: Joi.string().min(2).max(150).trim().optional(),
    manager_id: common.optionalUserId.optional(),
  }).min(1),

  updateBuildingStatus: Joi.object({
    is_active: Joi.boolean().required(),
  }),

  setBuildingManager: Joi.object({
    manager_id: common.userId,
  }),

  /* Lockers */

  createLocker: Joi.object({
    building_id: common.id.required(),
    locker_number: Joi.number().integer().positive().required(),
    notes: Joi.string().max(500).allow(null, '').optional(),
  }),

  updateLocker: Joi.object({
    locker_number: Joi.number().integer().positive().optional(),
    notes: Joi.string().max(500).allow(null, '').optional(),
  }).min(1),

  updateLockerStatus: Joi.object({
    is_active: Joi.boolean().required(),
  }),

  lockerEventsList: Joi.object({
    locker_id: common.id.optional(),
    user_id: Joi.string()
      .pattern(/^\d{9}$/)
      .optional(),
    building_id: common.id.optional(),
    event_type: Joi.string().valid('created', 'updated', 'activated', 'deactivated', 'opened', 'returned').optional(),
    from_date: common.dateIso.optional(),
    to_date: common.dateIso.optional(),
    limit: common.pagination.limit,
    offset: common.pagination.offset,
  }),
};
