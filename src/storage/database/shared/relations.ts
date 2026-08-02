import { relations } from "drizzle-orm/relations";
import { restaurants, menuItems, sellerApplications, orders, reviews, withdrawals, profiles, deliveryRecords, transactions } from "./schema";

export const profilesRelations = relations(profiles, ({ many }) => ({
  orders: many(orders),
  restaurants: many(restaurants),
  withdrawals: many(withdrawals),
  deliveries: many(deliveryRecords),
  transactions: many(transactions),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [restaurants.user_id],
    references: [profiles.id],
  }),
  orders: many(orders),
  reviews: many(reviews),
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [menuItems.restaurant_id],
    references: [restaurants.id],
  }),
}));

export const sellerApplicationsRelations = relations(sellerApplications, ({ one }) => ({
  applicant: one(profiles, {
    fields: [sellerApplications.user_id],
    references: [profiles.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurant_id],
    references: [restaurants.id],
  }),
  customer: one(profiles, {
    fields: [orders.user_id],
    references: [profiles.id],
  }),
  deliveries: many(deliveryRecords),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [reviews.restaurant_id],
    references: [restaurants.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(profiles, {
    fields: [withdrawals.user_id],
    references: [profiles.id],
  }),
}));

export const deliveryRecordsRelations = relations(deliveryRecords, ({ one }) => ({
  driver: one(profiles, {
    fields: [deliveryRecords.user_id],
    references: [profiles.id],
  }),
  order: one(orders, {
    fields: [deliveryRecords.order_id],
    references: [orders.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(profiles, {
    fields: [transactions.user_id],
    references: [profiles.id],
  }),
}));