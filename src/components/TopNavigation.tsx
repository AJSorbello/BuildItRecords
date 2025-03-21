import React, { Component } from 'react';
import { AppBar, Tabs, Tab, Box, styled, useMediaQuery, useTheme, IconButton, Theme } from '@mui/material';
import { useLocation, useNavigate, Location, NavigateFunction } from 'react-router-dom';
import RecordsSquareLogo from '../assets/png/records/BuildIt_Records_Square.png';
import TechSquareLogo from '../assets/png/tech/BuildIt_Tech_Square.png';
import DeepSquareLogo from '../assets/png/deep/BuildIt_Deep_Square.png';
import AnimatedHamburger from './AnimatedHamburger';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 100%)',
  boxShadow: 'none',
  borderBottom: 'none',
  height: '64px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1300,
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  '& .MuiToolbar-root': {
    background: 'transparent'
  },
  [theme.breakpoints.down('md')]: {
    padding: '0 8px',
    justifyContent: 'center'
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  flex: 1,
  height: '64px',
  backgroundColor: 'transparent',
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3, 
  },
  '& .MuiTabs-flexContainer': {
    justifyContent: 'space-between',
    height: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: '56px',  
    marginRight: '8px',
    '& .MuiTabs-flexContainer': {
      justifyContent: 'space-around'
    }
  }
}));

const StyledTab = styled(Tab)<{ tabtype: string }>(({ theme, tabtype }) => ({
  fontSize: '1rem',
  fontWeight: 600, 
  letterSpacing: '0.01em',
  color: theme.palette.text.primary,
  '&.Mui-selected': {
    color: tabtype === 'records' ? '#02FF95' : tabtype === 'tech' ? '#FF0000' : '#00BFFF',
    fontWeight: 700, 
  },
  '&:hover': {
    color: tabtype === 'records' ? '#02FF95' : tabtype === 'tech' ? '#FF0000' : '#00BFFF',
    opacity: 1,
  },
  textTransform: 'none',
  minWidth: 120,
  padding: '12px 16px',
  [theme.breakpoints.down('md')]: {
    minWidth: 60,
    padding: '4px',
    fontSize: '0.75rem'
  }
}));

const Logo = styled('img')<{ tabtype: string }>(({ tabtype, theme }) => ({
  width: '32px',
  height: '32px',
  filter: 'brightness(0) invert(1)',
  transition: 'all 0.3s ease',
  '.MuiTab-root:hover &': {
    filter: tabtype === 'records' ? 'brightness(0) invert(0.9) sepia(1) saturate(5) hue-rotate(70deg)' :
           tabtype === 'tech' ? 'brightness(0) invert(0.2) sepia(1) saturate(10000%) hue-rotate(0deg)' :
           'brightness(0) invert(0.75) sepia(1) saturate(5000%) hue-rotate(175deg)',
  },
  marginBottom: '2px',
  [theme.breakpoints.down('md')]: {
    width: '24px',
    height: '24px',
    marginBottom: '1px'
  }
}));

const TabContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: '2px',
  [`@media (max-width: 600px)`]: {
    gap: '1px'
  }
});

interface TopNavigationProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
  logo?: string;
  location?: Location;
  navigate?: NavigateFunction;
  theme?: Theme;
}

// Wrapper component to handle hooks
const TopNavigationWrapper: React.FC<Omit<TopNavigationProps, 'location' | 'navigate' | 'theme'>> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  return <TopNavigationClass {...props} location={location} navigate={navigate} theme={theme} />;
};

class TopNavigationClass extends Component<TopNavigationProps> {
  constructor(props: TopNavigationProps) {
    super(props);
  }

  getCurrentLabel = () => {
    const { location } = this.props;
    return location?.pathname.split('/')[1] || 'records';
  };

  handleChange = (event: React.SyntheticEvent, newValue: string) => {
    const { navigate } = this.props;
    if (navigate) {
      navigate(`/${newValue}`);
    }
  };

  getTabs = () => {
    return [
      {
        value: 'records',
        logo: RecordsSquareLogo,
        label: 'Records'
      },
      {
        value: 'tech',
        logo: TechSquareLogo,
        label: 'Tech'
      },
      {
        value: 'deep',
        logo: DeepSquareLogo,
        label: 'Deep'
      }
    ];
  };

  render() {
    const { onMenuClick, isMobile, theme } = this.props;
    const currentLabel = this.getCurrentLabel();
    const tabs = this.getTabs();

    return (
      <StyledAppBar>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          px: 2,
          background: 'transparent',
          position: 'relative',
          minWidth: { xs: '360px' } 
        }}>
          {isMobile && onMenuClick && (
            <Box
              sx={{ 
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                cursor: 'pointer'
              }}
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
              role="button"
            >
              <AnimatedHamburger onClick={onMenuClick} />
            </Box>
          )}
          <StyledTabs
            value={currentLabel}
            onChange={this.handleChange}
            aria-label="label navigation"
            TabIndicatorProps={{
              style: {
                backgroundColor: 
                  currentLabel === 'records' ? '#02FF95' :
                  currentLabel === 'tech' ? '#FF0000' :
                  '#00BFFF'
              }
            }}
          >
            {tabs.map((tab) => (
              <StyledTab
                key={tab.value}
                value={tab.value}
                tabtype={tab.value}
                label={
                  <TabContent>
                    <Logo src={tab.logo} alt={tab.label} tabtype={tab.value} />
                    <span>{tab.label}</span>
                  </TabContent>
                }
              />
            ))}
          </StyledTabs>
        </Box>
      </StyledAppBar>
    );
  }
}

export default TopNavigationWrapper;
