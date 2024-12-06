import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Paper,
  Chip, Rating, CircularProgress, IconButton, Divider,
  Card, CardContent, Link
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/game/${id}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        setGame(response.data);
        if (response.data.screenshots?.length > 0) {
          setSelectedScreenshot(response.data.screenshots[0]);
        }
      } catch (error) {
        console.error('Error fetching game details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGameDetails();
  }, [id]);

  // Helper function to get store URL
  const getStoreUrl = (game, storeType) => {
    switch (storeType) {
      case 'steam':
        return game.stores?.find(store => store.store?.slug === 'steam')?.url;
      case 'epic':
        return game.stores?.find(store => store.store?.slug === 'epic-games')?.url;
      case 'gog':
        return game.stores?.find(store => store.store?.slug === 'gog')?.url;
      default:
        return null;
    }
  };

  const storeLinks = {
    steam: {
      name: 'Steam',
      icon: <SportsEsportsIcon />,
      color: '#1b2838',
      url: getStoreUrl(game || {}, 'steam'),
    },
    epic: {
      name: 'Epic Games',
      icon: <StorefrontIcon />,
      color: '#2a2a2a',
      url: getStoreUrl(game || {}, 'epic'),
    },
    gog: {
      name: 'GOG',
      icon: <ShoppingCartIcon />,
      color: '#5c2d91',
      url: getStoreUrl(game || {}, 'gog'),
    },
  };

  // Screenshot Gallery Component
  const ScreenshotGallery = ({ screenshots }) => (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        py: 2,
        px: 1,
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: 4,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.4)',
          },
        },
      }}
    >
      {screenshots.map((screenshot, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Box
            component="img"
            src={screenshot}
            alt={`Screenshot ${index + 1}`}
            sx={{
              height: 150,
              borderRadius: 2,
              cursor: 'pointer',
              objectFit: 'cover',
            }}
            onClick={() => {
              setSelectedScreenshot(screenshot);
              setShowLightbox(true);
            }}
          />
        </motion.div>
      ))}
    </Box>
  );

  // Lightbox Component
  const Lightbox = ({ screenshot, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
        onClick={onClose}
      >
        <IconButton
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: 'white',
          }}
          onClick={onClose}
        >
          <ClearIcon />
        </IconButton>
        <Box
          component="img"
          src={screenshot}
          alt="Screenshot"
          sx={{
            maxWidth: '90%',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: 2,
          }}
        />
      </Box>
    </motion.div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!game) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5">Game not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Search
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Back Button */}
      <Box sx={{ py: 2 }}>
        <IconButton onClick={() => navigate('/')} sx={{ color: 'white' }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            position: 'relative',
            height: '500px',
            borderRadius: 4,
            overflow: 'hidden',
            mb: 4,
          }}
        >
          {/* Background Image with Gradient Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${game.background_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.9) 100%)',
              },
            }}
          />

          {/* Game Info Overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 4,
              color: 'white',
              zIndex: 1,
            }}
          >
            <Typography variant="h2" component="h1" gutterBottom>
              {game.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating
                value={game.rating || 0}
                precision={0.1}
                readOnly
                emptyIcon={<StarIcon style={{ color: 'rgba(255,255,255,0.3)' }} />}
              />
              <Typography variant="h6" sx={{ ml: 1 }}>
                {game.rating ? `${game.rating.toFixed(1)}/5` : 'No rating'}
              </Typography>
              {game.metacritic && (
                <Chip
                  label={`Metacritic: ${game.metacritic}`}
                  color="primary"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {game.genres.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                About
              </Typography>
              <Typography paragraph>
                {game.description}
              </Typography>
            </Paper>
          </motion.div>

          {/* Store Links */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Where to Buy
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(storeLinks).map(([store, info]) => (
                  game[`${store}_id`] && (
                    <Grid item xs={12} sm={4} key={store}>
                      <Link
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="none"
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={info.icon}
                          sx={{
                            backgroundColor: info.color,
                            '&:hover': {
                              backgroundColor: info.color,
                              opacity: 0.9,
                            },
                          }}
                        >
                          {info.name}
                        </Button>
                      </Link>
                    </Grid>
                  )
                ))}
              </Grid>
            </Paper>
          </motion.div>

          {/* Screenshots */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {game.screenshots?.length > 0 && (
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Screenshots
                </Typography>
                <ScreenshotGallery screenshots={game.screenshots} />
              </Paper>
            )}
          </motion.div>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Game Info Card */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Game Info
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography color="text.secondary">Released</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography>
                      {new Date(game.released).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography color="text.secondary">Platforms</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {game.platforms.map((platform) => (
                        <Chip
                          key={platform.id}
                          label={platform.name}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* System Requirements */}
            {game.platforms.map((platform) => (
              platform.requirements && (
                <Card key={platform.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {platform.name} Requirements
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    {platform.requirements.minimum && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Minimum Requirements
                        </Typography>
                        <div dangerouslySetInnerHTML={{ __html: platform.requirements.minimum }} />
                      </Box>
                    )}
                    {platform.requirements.recommended && (
                      <Box>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Recommended Requirements
                        </Typography>
                        <div dangerouslySetInnerHTML={{ __html: platform.requirements.recommended }} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )
            ))}

            {/* Game Stats */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Game Stats
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  {game.metacritic && (
                    <Grid item xs={6}>
                      <Typography color="text.secondary">Metacritic</Typography>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: game.metacritic >= 75 ? '#6dc849' :
                                        game.metacritic >= 50 ? '#fdca52' : '#fc4b37',
                          color: game.metacritic >= 75 ? 'white' : 'black',
                        }}
                      >
                        {game.metacritic}
                      </Box>
                    </Grid>
                  )}
                  {game.rating && (
                    <Grid item xs={6}>
                      <Typography color="text.secondary">User Rating</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={game.rating} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({game.rating.toFixed(1)})
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {game.playtime && (
                    <Grid item xs={6}>
                      <Typography color="text.secondary">Average Playtime</Typography>
                      <Typography>{game.playtime} hours</Typography>
                    </Grid>
                  )}
                  {game.released && (
                    <Grid item xs={6}>
                      <Typography color="text.secondary">Release Date</Typography>
                      <Typography>{new Date(game.released).toLocaleDateString()}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Tags */}
            {game.tags?.length > 0 && (
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {game.tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </Grid>
      </Grid>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && selectedScreenshot && (
          <Lightbox
            screenshot={selectedScreenshot}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </AnimatePresence>
    </Container>
  );
};

export default GameDetails; 