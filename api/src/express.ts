import Express from "express";

export const express = Express();
express.use(Express.json());
express.use(Express.urlencoded({ extended: true }));

export default express;
