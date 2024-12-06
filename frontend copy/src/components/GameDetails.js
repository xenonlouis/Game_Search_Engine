import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  IconButton,
  Paper,
  Rating,
  Divider,
  Button,
  Tab,
  Tabs,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '70vh',
  color: 'white',
  display: 'flex',
  alignItems: 'flex-end',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)',
    zIndex: 1,
  },
}));

const ScreenshotGallery = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '10px',
  overflowX: 'auto',
  padding: '20px 0',
  '&::-webkit-scrollbar': {
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.1)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
  },
}));

const Screenshot = styled('img')({
  height: '150px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },
});

const StoreButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}));

const MetacriticScore = styled(Box)(({ score }) => ({
  padding: '8px 16px',
  borderRadius: '4px',
  fontWeight: 'bold',
  backgroundColor: score >= 75 ? '#6dc849' : score >= 50 ? '#fdca52' : '#fc4b37',
  color: score >= 75 ? '#fff' : '#000',
}));

const LoadingSkeleton = () => (
  <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white', py: 4 }}>
    <Container>
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Skeleton variant="rectangular" height={200} sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rectangular" height={600} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        </Grid>
      </Grid>
    </Container>
  </Box>
);

const ErrorDisplay = ({ message }) => (
  <Box
    sx={{
      backgroundColor: '#121212',
      minHeight: '100vh',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      p: 3,
    }}
  >
    <Typography variant="h5" gutterBottom>
      Error Loading Game
    </Typography>
    <Typography color="error" sx={{ mb: 2 }}>
      {message}
    </Typography>
    <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
      Try Again
    </Button>
  </Box>
);

const RequirementsDisplay = ({ requirements }) => {
  // Function to safely render HTML content
  const createMarkup = (html) => ({ __html: html });

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: 'rgba(255,255,255,0.05)',
        '& ul': { 
          pl: 2,
          mb: 0,
          '& li': {
            mb: 1,
            '&:last-child': { mb: 0 }
          }
        },
        '& strong': {
          color: 'primary.main'
        }
      }}
    >
      <Typography 
        variant="body2" 
        component="div"
        dangerouslySetInnerHTML={createMarkup(requirements)}
        sx={{
          '& br': { display: 'block', content: '""', mb: 1 },
          '& ul': { listStyle: 'none', p: 0 },
          '& li': { mb: 1 },
          '& strong': { color: 'primary.main', fontWeight: 'bold' }
        }}
      />
    </Paper>
  );
};

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/game/${id}`);
        setGame(response.data);
        if (response.data?.screenshots?.length > 0) {
          setSelectedScreenshot(response.data.screenshots[0]);
        }
      } catch (error) {
        console.error('Error fetching game details:', error);
        setError(error.response?.data?.message || 'Failed to load game details');
      } finally {
        setLoading(false);
      }
    };
    fetchGameDetails();
  }, [id]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!game) {
    return <ErrorDisplay message="Game not found" />;
  }

  const handleScreenshotClick = (screenshot) => {
    setSelectedScreenshot(screenshot);
  };

  // Safely access nested properties
  const screenshots = game.screenshots || [];
  const platforms = Array.isArray(game.platforms) ? game.platforms : [];
  const genres = Array.isArray(game.genres) ? game.genres : [];
  const tags = Array.isArray(game.tags) ? game.tags.filter(tag => tag && tag.name) : [];
  const stores = Array.isArray(game.stores) ? game.stores : [];
  const ratings = Array.isArray(game.ratings) ? game.ratings : [];
  const addedByStatus = game.added_by_status || {};

  // Helper function to safely check if an object has required properties
  const isValidPlatform = (platform) => {
    return platform && 
           typeof platform === 'object' && 
           platform.name &&
           !Array.isArray(platform);
  };

  // Filter out invalid platforms and ensure they have required properties
  const validPlatforms = platforms.filter(platform => {
    return platform && 
           typeof platform === 'object' && 
           platform.name &&
           !Array.isArray(platform);
  });

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{ position: 'fixed', top: 20, left: 20, zIndex: 1000, color: 'white' }}
      >
        <ArrowBackIcon />
      </IconButton>

      <HeroSection
        sx={{
          backgroundImage: `url(${selectedScreenshot || game.background_image || ''})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container sx={{ position: 'relative', zIndex: 2, pb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h2" component="h1" gutterBottom>
              {game.name}
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              {game.metacritic && (
                <Grid item>
                  <MetacriticScore score={game.metacritic}>
                    {game.metacritic}
                  </MetacriticScore>
                </Grid>
              )}
              
              {game.esrb_rating && (
                <Grid item>
                  <Chip 
                    label={game.esrb_rating} 
                    sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  />
                </Grid>
              )}
              
              {game.rating && (
                <Grid item>
                  <Rating
                    value={game.rating}
                    precision={0.5}
                    readOnly
                    sx={{ color: 'white' }}
                  />
                </Grid>
              )}
            </Grid>
          </motion.div>
        </Container>
      </HeroSection>

      <Container sx={{ mt: -8, position: 'relative', zIndex: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Paper sx={{ p: 3, bgcolor: 'rgba(32, 32, 32, 0.9)', mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Screenshots
                </Typography>
                <ScreenshotGallery>
                  {screenshots.map((screenshot, index) => (
                    <Screenshot
                      key={index}
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      onClick={() => handleScreenshotClick(screenshot)}
                    />
                  ))}
                </ScreenshotGallery>
              </Paper>

              <Paper sx={{ p: 3, bgcolor: 'rgba(32, 32, 32, 0.9)' }}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  sx={{ mb: 3 }}
                >
                  <Tab label="About" />
                  <Tab label="System Requirements" />
                  <Tab label="Ratings" />
                </Tabs>

                <AnimatePresence mode='wait'>
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 0 && (
                      <Box>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" color="text.secondary">
                              Release Date
                            </Typography>
                            <Typography variant="body1">
                              {new Date(game.released).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" color="text.secondary">
                              Average Playtime
                            </Typography>
                            <Typography variant="body1">
                              {game.playtime} hours
                            </Typography>
                          </Grid>
                        </Grid>

                        <Typography variant="h6" gutterBottom>
                          Features
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                          {tags.map((tag) => (
                            <Chip
                              key={tag.slug}
                              label={tag.name}
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {activeTab === 1 && (
                      <Box>
                        {validPlatforms.map((platform) => (
                          platform.requirements?.minimum && (
                            <Box key={platform.id || platform.name} sx={{ mb: 4 }}>
                              <Typography variant="h6" gutterBottom>
                                {platform.name}
                              </Typography>

                              {platform.requirements.minimum && (
                                <>
                                  <Typography 
                                    variant="subtitle1" 
                                    color="primary"
                                    sx={{ 
                                      mb: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      '&::before': {
                                        content: '""',
                                        display: 'inline-block',
                                        width: 4,
                                        height: 20,
                                        bgcolor: 'primary.main',
                                        mr: 1,
                                        borderRadius: 1
                                      }
                                    }}
                                  >
                                    Minimum Requirements
                                  </Typography>
                                  <RequirementsDisplay requirements={platform.requirements.minimum} />
                                </>
                              )}

                              {platform.requirements.recommended && (
                                <>
                                  <Typography 
                                    variant="subtitle1" 
                                    color="secondary"
                                    sx={{ 
                                      mb: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      '&::before': {
                                        content: '""',
                                        display: 'inline-block',
                                        width: 4,
                                        height: 20,
                                        bgcolor: 'secondary.main',
                                        mr: 1,
                                        borderRadius: 1
                                      }
                                    }}
                                  >
                                    Recommended Requirements
                                  </Typography>
                                  <RequirementsDisplay requirements={platform.requirements.recommended} />
                                </>
                              )}
                            </Box>
                          )
                        ))}
                      </Box>
                    )}

                    {activeTab === 2 && (
                      <Box>
                        {ratings.map((rating) => (
                          <Box key={rating.id} sx={{ mb: 2 }}>
                            <Typography variant="subtitle1">
                              {rating.title} ({rating.percent}%)
                            </Typography>
                            <Box
                              sx={{
                                height: 8,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                borderRadius: 1,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${rating.percent}%`,
                                  bgcolor: 'primary.main',
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Paper sx={{ p: 3, bgcolor: 'rgba(32, 32, 32, 0.9)', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Available On
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {validPlatforms.map((platform) => (
                    <Chip
                      key={platform.id || platform.name}
                      label={platform.name}
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Where to Buy
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {stores.map((store) => (
                    <StoreButton
                      key={store.store_slug}
                      variant="contained"
                      startIcon={<StorefrontIcon />}
                      href={`https://${store.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {store.store_name}
                    </StoreButton>
                  ))}
                </Box>
              </Paper>

              <Paper sx={{ p: 3, bgcolor: 'rgba(32, 32, 32, 0.9)' }}>
                <Typography variant="h6" gutterBottom>
                  Game Stats
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reviews
                    </Typography>
                    <Typography variant="body1">
                      {game.reviews_count}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Players
                    </Typography>
                    <Typography variant="body1">
                      {game.added}
                    </Typography>
                  </Grid>
                  {Object.entries(addedByStatus).map(([status, count]) => (
                    <Grid item xs={6} key={status}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Typography>
                      <Typography variant="body1">
                        {count}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default GameDetails; 