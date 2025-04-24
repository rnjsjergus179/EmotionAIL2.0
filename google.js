const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

router.get('/google-search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: '검색어가 필요합니다.' });
  }

  try {
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      return res.status(500).json({ error:GOOGLE_API_KEY
