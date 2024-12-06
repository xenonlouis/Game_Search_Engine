import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Container,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const SearchTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
  },
});

const GameCard = styled(motion(Card))({
  backgroundColor: 'rgba(32, 32, 32, 0.9)',
  borderRadius: '12px',
  transition: 'transform 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
});

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    // Fetch platforms and genres on component mount
    const fetchFilters = async () => {
      try {
        const [platformsRes, genresRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/platforms/`),
          axios.get(`${API_BASE_URL}/genres/`)
        ]);
        setPlatforms(platformsRes.data.platforms);
        setGenres(genresRes.data.genres);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(selectedPlatform && { platform: selectedPlatform }),
        ...(selectedGenre && { genre: selectedGenre }),
        ...(minRating > 0 && { min_rating: minRating })
      });

      const response = await axios.get(`${API_BASE_URL}/search/?${params}`);
      setGames(response.data);
    } catch (error) {
      console.error('Error searching games:', error);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    }
  }, [searchQuery, selectedPlatform, selectedGenre, minRating]);

  const handleGameClick = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: 'white',
        py: 4
      }}
    >
      <Container>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Game Search Engine
          </Typography>
          <SearchTextField
            fullWidth
            variant="outlined"
            placeholder="Search for games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'white' }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Platform</InputLabel>
                <Select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  label="Platform"
                >
                  <MenuItem value="">All Platforms</MenuItem>
                  {platforms.map((platform) => (
                    <MenuItem key={platform} value={platform}>
                      {platform}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Genre</InputLabel>
                <Select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  label="Genre"
                >
                  <MenuItem value="">All Genres</MenuItem>
                  {genres.map((genre) => (
                    <MenuItem key={genre} value={genre}>
                      {genre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ px: 2 }}>
                <Typography gutterBottom>Minimum Rating</Typography>
                <Slider
                  value={minRating}
                  onChange={(e, newValue) => setMinRating(newValue)}
                  min={0}
                  max={5}
                  step={0.5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {games.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game.id}>
              <GameCard
                onClick={() => handleGameClick(game.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={game.background_image || 'placeholder.jpg'}
                  alt={game.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {game.name}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    {game.genres.slice(0, 3).map((genre) => (
                      <Chip
                        key={genre}
                        label={genre}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Rating: {game.rating ? game.rating.toFixed(1) : 'N/A'}/5
                  </Typography>
                </CardContent>
              </GameCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default SearchPage; 