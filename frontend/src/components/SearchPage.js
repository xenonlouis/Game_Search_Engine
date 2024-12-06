import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container, TextField, Card, CardContent, CardMedia, Typography,
  Grid, Box, Chip, Rating, InputAdornment,
  Paper, CircularProgress, Slider, AppBar, Toolbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  backgroundColor: 'rgba(30, 30, 40, 0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(81, 51, 171, 0.1)',
  borderRadius: '12px',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(81, 51, 171, 0.2)',
    border: '1px solid rgba(81, 51, 171, 0.3)',
    '& .MuiCardMedia-root': {
      transform: 'scale(1.05)',
    },
  },
  '& .MuiCardMedia-root': {
    transition: 'transform 0.3s ease-in-out',
  },
}));

const FilterChip = styled(Chip)(({ theme, selected }) => ({
  backgroundColor: selected ? 'rgba(81, 51, 171, 0.9)' : 'rgba(81, 51, 171, 0.1)',
  color: selected ? '#fff' : 'rgba(255, 255, 255, 0.7)',
  border: `1px solid ${selected ? 'rgba(81, 51, 171, 0.9)' : 'rgba(81, 51, 171, 0.2)'}`,
  borderRadius: '8px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: selected ? 'rgba(81, 51, 171, 0.8)' : 'rgba(81, 51, 171, 0.2)',
    transform: 'translateY(-2px)',
  },
  margin: '2px',
  height: '28px',
}));

const SearchBar = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    backgroundColor: 'rgba(81, 51, 171, 0.1)',
    borderRadius: '12px',
    color: 'white',
    border: '1px solid rgba(81, 51, 171, 0.2)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: 'rgba(81, 51, 171, 0.15)',
      border: '1px solid rgba(81, 51, 171, 0.3)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(81, 51, 171, 0.2)',
      border: '1px solid rgba(81, 51, 171, 0.4)',
    },
  },
  '& .MuiInputBase-input': {
    padding: '12px 16px',
  },
}));

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [games, setGames] = useState(() => {
    const savedGames = localStorage.getItem('lastSearchResults');
    return savedGames ? JSON.parse(savedGames) : [];
  });
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState(searchParams.get('platform') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [minRating, setMinRating] = useState(Number(searchParams.get('rating')) || 0);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const loadingRef = React.useRef(null);

  const platforms = [
    'All Platforms',
    'PC',
    'PlayStation 5',
    'PlayStation 4',
    'Xbox Series X',
    'Xbox One',
    'Nintendo Switch'
  ];

  const genres = [
    'All Genres',
    'Action',
    'Adventure',
    'RPG',
    'Strategy',
    'Shooter',
    'Sports',
    'Racing',
    'Indie'
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'release_date', label: 'Release Date' },
    { value: 'name', label: 'Name' }
  ];

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (platform) params.set('platform', platform);
    if (genre) params.set('genre', genre);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (minRating > 0) params.set('rating', minRating);
    setSearchParams(params);
  }, [query, platform, genre, sortBy, minRating]);

  const searchGames = async (isLoadingMore = false) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        q: query,
        page: isLoadingMore ? page + 1 : 1,
        ...(platform && platform !== 'All Platforms' && { platform }),
        ...(genre && genre !== 'All Genres' && { genre }),
        ...(sortBy && { sort_by: sortBy }),
        min_rating: minRating
      };
      const response = await axios.get('http://localhost:8000/search', { params });
      
      if (isLoadingMore) {
        setGames(prev => [...prev, ...response.data]);
        setPage(page + 1);
      } else {
        setGames(response.data);
        setPage(1);
      }
      setHasMore(response.data.length === 20); // Assuming 20 is the page size
      
      if (!isLoadingMore) {
        localStorage.setItem('lastSearchResults', JSON.stringify(response.data));
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while searching games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.trim()) {
        searchGames();
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [query, platform, genre, sortBy, minRating]);

  const handleClear = () => {
    setQuery('');
    setGames([]);
    setSearchParams({});
    localStorage.removeItem('lastSearchResults');
  };

  return (
    <Box sx={{ 
      backgroundColor: '#0a0a0f',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
    }}>
      {/* Top Navigation Bar */}
      <AppBar position="sticky" sx={{ 
        backgroundColor: 'rgba(20, 20, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(81, 51, 171, 0.2)',
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #8257e6 0%, #5133ab 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Game Search Engine
          </Typography>
          <Box sx={{ flexGrow: 1, mx: 4, maxWidth: 600 }}>
            <SearchBar
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for games..."
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
                endAdornment: query && (
                  <InputAdornment position="end">
                    <Chip
                      icon={<ClearIcon />}
                      label="Clear"
                      size="small"
                      onClick={handleClear}
                      sx={{
                        backgroundColor: 'rgba(81, 51, 171, 0.1)',
                        border: '1px solid rgba(81, 51, 171, 0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(81, 51, 171, 0.2)',
                        },
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Toolbar>

        {/* Filter Section */}
        <Box sx={{ 
          borderTop: '1px solid rgba(81, 51, 171, 0.1)',
          px: 2,
          py: 1.5,
        }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  minWidth: '70px',
                }}>
                  Sort by:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {sortOptions.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      onClick={() => setSortBy(option.value)}
                      selected={sortBy === option.value}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={9}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    minWidth: '70px',
                  }}>
                    Platform:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {platforms.map((p) => (
                      <FilterChip
                        key={p}
                        label={p}
                        onClick={() => setPlatform(p === 'All Platforms' ? '' : p)}
                        selected={platform === p || (!platform && p === 'All Platforms')}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    minWidth: '70px',
                  }}>
                    Genre:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {genres.map((g) => (
                      <FilterChip
                        key={g}
                        label={g}
                        onClick={() => setGenre(g === 'All Genres' ? '' : g)}
                        selected={genre === g || (!genre && g === 'All Genres')}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    minWidth: '70px',
                  }}>
                    Rating:
                  </Typography>
                  <Slider
                    value={minRating}
                    onChange={(e, newValue) => setMinRating(newValue)}
                    min={0}
                    max={5}
                    step={0.5}
                    valueLabelDisplay="auto"
                    sx={{
                      width: 100,
                      ml: 2,
                      color: '#8257e6',
                      '& .MuiSlider-rail': { backgroundColor: 'rgba(81, 51, 171, 0.3)' },
                      '& .MuiSlider-track': { backgroundColor: '#8257e6' },
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#8257e6',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(130, 87, 230, 0.16)',
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Loading Indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: '#8257e6' }} />
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Box sx={{ 
            p: 2, 
            my: 2, 
            backgroundColor: 'rgba(255, 0, 0, 0.1)', 
            borderRadius: 1,
            border: '1px solid rgba(255, 0, 0, 0.3)'
          }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* Results Grid */}
        <Grid container spacing={3}>
          {games.map((game, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={game.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <StyledCard onClick={() => navigate(`/game/${game.id}`)}>
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height="300"
                      image={game.background_image || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={game.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        p: 1,
                        borderRadius: '0 0 0 12px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <Rating
                        value={game.rating || 0}
                        precision={0.1}
                        readOnly
                        size="small"
                        emptyIcon={<StarIcon style={{ color: 'rgba(255,255,255,0.3)' }} fontSize="inherit" />}
                      />
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap sx={{
                      color: '#fff',
                      fontWeight: 500,
                    }}>
                      {game.name}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      {game.genres.slice(0, 3).map((genre) => (
                        <Chip
                          key={genre}
                          label={genre}
                          size="small"
                          sx={{
                            mr: 0.5,
                            mb: 0.5,
                            backgroundColor: 'rgba(81, 51, 171, 0.1)',
                            border: '1px solid rgba(81, 51, 171, 0.2)',
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" sx={{
                      color: 'rgba(255,255,255,0.6)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1,
                    }}>
                      {game.description}
                    </Typography>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 1,
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Released: {new Date(game.released).toLocaleDateString()}
                      </Typography>
                      {game.metacritic && (
                        <Chip
                          label={`${game.metacritic}`}
                          size="small"
                          sx={{
                            backgroundColor: game.metacritic >= 75 ? 'rgba(109, 200, 73, 0.1)' : 
                                          game.metacritic >= 50 ? 'rgba(253, 202, 82, 0.1)' : 'rgba(252, 75, 55, 0.1)',
                            color: game.metacritic >= 75 ? '#6dc849' : 
                                  game.metacritic >= 50 ? '#fdca52' : '#fc4b37',
                            border: `1px solid ${
                              game.metacritic >= 75 ? '#6dc849' : 
                              game.metacritic >= 50 ? '#fdca52' : '#fc4b37'
                            }`,
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </StyledCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* No Results Message */}
        {!loading && query && games.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              No games found matching your search
            </Typography>
          </Box>
        )}

        <Box ref={loadingRef} sx={{ height: 20, mt: 2 }}>
          {hasMore && !loading && games.length > 0 && (
            <Typography 
              align="center" 
              sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onClick={() => searchGames(true)}
            >
              Load More Games
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default SearchPage; 