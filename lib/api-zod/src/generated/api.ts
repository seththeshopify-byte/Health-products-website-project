

/**
 * @summary List all rooms
 */
export const ListRoomsResponseItem = zod.object({
  "id": zod.number().int(),
  "name": zod.string(),
  "description": zod.string(),
  "imageUrl": zod.string().nullable(),
  "imageUrls": zod.array(zod.string()).optional(),
  "videoUrls": zod.array(zod.string()).optional(),
  "guestPrice": zod.number(),
  "memberPrice": zod.number(),
  "commissionPct": zod.number(),
  "createdAt": zod.coerce.date()
})
export const ListRoomsResponse = zod.array(ListRoomsResponseItem)

/**
 * @summary Create a room (admin)
 */
export const CreateRoomBody = zod.object({
  "name": zod.string(),
  "description": zod.string(),
  "imageUrl": zod.string().nullish(),
  "imageUrls": zod.array(zod.string()).optional(),
  "videoUrls": zod.array(zod.string()).optional(),
  "guestPrice": zod.number(),
  "memberPrice": zod.number(),
  "commissionPct": zod.number()
})

export const CreateRoomResponse = zod.object({
  "id": zod.number().int(),
  "name": zod.string(),
  "description": zod.string(),
  "imageUrl": zod.string().nullable(),
  "imageUrls": zod.array(zod.string()).optional(),
  "videoUrls": zod.array(zod.string()).optional(),
  "guestPrice": zod.number(),
  "memberPrice": zod.number(),
  "commissionPct": zod.number(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Get a room
 */
export const GetRoomParams = zod.object({
  "id": zod.coerce.number().int()
})

export const GetRoomResponse = zod.object({
  "id": zod.number().int(),
  "name": zod.string(),
  "description": zod.string(),
  "imageUrl": zod.string().nullable(),
  "imageUrls": zod.array(zod.string()).optional(),
  "videoUrls": zod.array(zod.string()).optional(),
  "guestPrice": zod.number(),
  "memberPrice": zod.number(),
  "commissionPct": zod.number(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Update a room (admin)
 */
export const UpdateRoomParams = zod.object({
  "id": zod.coerce.number().int()
})

export const UpdateRoomBody = zod.object({
  "name": zod.string().optional(),
  "description": zod.string().optional(),
  "imageUrl": zod.string().nullish(),
  "imageUrls": zod.array(zod.string()).optional(),
  "videoUrls": zod.array(zod.string()).optional(),
  "guestPrice": zod.number().optional(),
  "memberPrice": zod.number().optional(),
  "commissionPct": zod.number().optional()
})

export const UpdateRoomResponse = zod.object({
  "id": zod.number().int(),
  "name": zod.string(),
  "description": zod.string(),
  "imageUrl": zod.string().nullable(),
  "imageUrls": zod.array(zod.string()).optional(),
  "videoUrls": zod.array(zod.string()).optional(),
  "guestPrice": zod.number(),
  "memberPrice": zod.number(),
  "commissionPct": zod.number(),
  "createdAt": zod.coerce.date()
})

/**
 * @summary Delete a room (admin)
 */
export const DeleteRoomParams = zod.object({
  "id": zod.coerce.number().int()
})

export const DeleteRoomResponse = zod.object({
  "success": zod.boolean()
})
