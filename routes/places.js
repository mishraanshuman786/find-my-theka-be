const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { saveSearchHistory } = require('../db');

const router = express.Router();

const MAPPLS_API_URL = process.env.MAPPLS_API_URL || 'https://search.mappls.com/search/places/nearby/json';
const MAPPLS_ACCESS_TOKEN = process.env.MAPPLS_ACCESS_TOKEN || 'rxhufjhrshhoapvhbzrmzrsdfplpbusnbauk';
const DEFAULT_RADIUS = parseInt(process.env.DEFAULT_RADIUS) || 5000;
const DEFAULT_REGION = process.env.DEFAULT_REGION || 'IND';
const DEFAULT_KEYWORDS = process.env.DEFAULT_KEYWORDS || 'RTSWIN';

// Validation error helper
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  return null;
};

// GET /api/places/nearby - Find nearby liquor shops
router.get('/nearby', [
  body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  // Get location from query params
  let lat = parseFloat(req.query.lat);
  let lng = parseFloat(req.query.lng);
  
  // If no coordinates provided, use default (Varanasi)
  if (isNaN(lat) || isNaN(lng)) {
    lat = 25.4358;
    lng = 82.8534;
  }

  const radius = parseInt(req.query.radius) || DEFAULT_RADIUS;
  const keywords = req.query.keywords || DEFAULT_KEYWORDS;
  const page = parseInt(req.query.page) || 1;

  try {
    console.log(`📍 Searching nearby: lat=${lat}, lng=${lng}, radius=${radius}m, keywords=${keywords}`);

    // Build Mappls API URL
    const params = {
      keywords: keywords,
      refLocation: `${lat},${lng}`,
      radius: radius,
      page: page,
      region: DEFAULT_REGION,
      sortBy: 'dist:asc',
      access_token: MAPPLS_ACCESS_TOKEN
    };

    // Call Mappls API
    const response = await axios.get(MAPPLS_API_URL, { params });
    console.log("Response from mapple:", )

    const suggestedLocations = response.data?.suggestedLocations || [];

    // Save search history if authenticated
    if (req.user) {
      try {
        await saveSearchHistory(req.user.userId, lat, lng, radius, suggestedLocations.length);
      } catch (err) {
        console.error('Failed to save search history:', err);
      }
    }

    // Format response
    res.json({
      success: true,
      message: `Found ${suggestedLocations.length} liquor shop(s) nearby`,
      data: {
        searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: radius,
        totalResults: suggestedLocations.length,
        places: suggestedLocations.map((place, index) => ({
          id: place.eLoc || `place-${index}`,
          name: place.placeName,
          address: place.placeAddress,
          distance: place.distance,
          eLoc: place.eLoc,
          type: place.type,
          keywords: place.keywords,
          location: place.lat_lng ? {
            lat: place.lat_lng.split(',')[0],
            lng: place.lat_lng.split(',')[1]
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('Mappls API error:', error.response?.data || error.message);
    
    // Return mock data as fallback when Mappls API is unavailable
    const mockPlaces = [
      {
        id: 'MQEMHP',
        name: 'Wine Shop',
        address: 'SH 98, Pindra, Varanasi District, Uttar Pradesh, 221006',
        distance: 120,
        eLoc: 'MQEMHP',
        type: 'POI',
        keywords: ['RTSWIN'],
        location: { lat: '25.4370', lng: '82.8545' }
      },
      {
        id: 'P1XHWZ',
        name: 'Foreign Liquor Shop',
        address: 'Pindra, Varanasi District, Uttar Pradesh, 221006',
        distance: 657,
        eLoc: 'P1XHWZ',
        type: 'POI',
        keywords: ['RTSWIN'],
        location: { lat: '25.4410', lng: '82.8590' }
      },
      {
        id: 'X2YAWB',
        name: 'UP State Beer Shop',
        address: 'Lanka, Varanasi, Uttar Pradesh, 221005',
        distance: 1200,
        eLoc: 'X2YAWB',
        type: 'POI',
        keywords: ['RTSWIN'],
        location: { lat: '25.4280', lng: '82.8450' }
      },
      {
        id: 'Z3BCDE',
        name: 'Premium Wine & Spirits',
        address: 'Sigra, Varanasi, Uttar Pradesh, 221010',
        distance: 2300,
        eLoc: 'Z3BCDE',
        type: 'POI',
        keywords: ['RTSWIN'],
        location: { lat: '25.4500', lng: '82.8700' }
      }
    ];

    // Save search history if authenticated
    if (req.user) {
      try {
        await saveSearchHistory(req.user.userId, lat, lng, radius, mockPlaces.length);
      } catch (err) {
        console.error('Failed to save search history:', err);
      }
    }

    res.json({
      success: true,
      message: `Found ${mockPlaces.length} liquor shop(s) nearby (demo data)`,
      data: {
        searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: radius,
        totalResults: mockPlaces.length,
        isMockData: true,
        places: mockPlaces
      }
    });
  }
});

// POST /api/places/search - Search with specific keywords
router.post('/search', [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('keywords').optional().isString().trim(),
  body('radius').optional().isInt({ min: 100, max: 50000 }).withMessage('Radius must be between 100-50000 meters')
], async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { lat, lng } = req.body;
    const radius = parseInt(req.body.radius) || DEFAULT_RADIUS;
    const keywords = req.body.keywords || DEFAULT_KEYWORDS;
    const page = parseInt(req.body.page) || 1;

    console.log(`🔍 Searching: lat=${lat}, lng=${lng}, keywords=${keywords}`);

    const mapplsUrl = `${MAPPLS_API_URL}`;
    const params = {
      keywords: keywords,
      refLocation: `${lat},${lng}`,
      radius: radius,
      page: page,
      region: DEFAULT_REGION,
      sortBy: 'dist:asc',
      access_token: MAPPLS_ACCESS_TOKEN
    };

    const response = await axios.get(mapplsUrl, { params });

    const suggestedLocations = response.data?.suggestedLocations || [];

    res.json({
      success: true,
      message: `Found ${suggestedLocations.length} place(s)`,
      data: {
        searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: radius,
        totalResults: suggestedLocations.length,
        places: suggestedLocations.map((place, index) => ({
          id: place.eLoc || `place-${index}`,
          name: place.placeName,
          address: place.placeAddress,
          distance: place.distance,
          eLoc: place.eLoc,
          type: place.type,
          keywords: place.keywords,
          location: place.lat_lng ? {
            lat: place.lat_lng.split(',')[0],
            lng: place.lat_lng.split(',')[1]
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    
    // Return mock data as fallback
    const mockPlaces = [
      { id: 'MQEMHP', name: 'Wine Shop', address: 'SH 98, Pindra, Varanasi, UP 221006', distance: 120, eLoc: 'MQEMHP', type: 'POI', keywords: ['RTSWIN'], location: { lat: '25.4370', lng: '82.8545' } },
      { id: 'P1XHWZ', name: 'Foreign Liquor Shop', address: 'Pindra, Varanasi, UP 221006', distance: 657, eLoc: 'P1XHWZ', type: 'POI', keywords: ['RTSWIN'], location: { lat: '25.4410', lng: '82.8590' } },
    ];

    res.json({
      success: true,
      message: `Found ${mockPlaces.length} place(s) (demo data)`,
      data: { searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) }, radius, totalResults: mockPlaces.length, isMockData: true, places: mockPlaces }
    });
  }
});

// GET /api/places/history - Get search history (protected)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { getUserSearchHistory } = require('../db');
    const history = await getUserSearchHistory(req.user.userId, 20);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search history'
    });
  }
});

module.exports = router;
