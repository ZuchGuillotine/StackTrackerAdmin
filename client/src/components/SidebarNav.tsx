
import React from 'react';
import { NavLink } from 'react-router-dom';
import { List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Article as BlogIcon,
  Science as ResearchIcon,
  People as UsersIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const SidebarNav = () => {
  return (
    <List>
      <ListItem component={NavLink} to="/" end>
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItem>
      
      <ListItem component={NavLink} to="/blog">
        <ListItemIcon>
          <BlogIcon />
        </ListItemIcon>
        <ListItemText primary="Blog Posts" />
      </ListItem>
      
      <ListItem component={NavLink} to="/research">
        <ListItemIcon>
          <ResearchIcon />
        </ListItemIcon>
        <ListItemText primary="Research" />
      </ListItem>
      
      <ListItem component={NavLink} to="/users">
        <ListItemIcon>
          <UsersIcon />
        </ListItemIcon>
        <ListItemText primary="Users" />
      </ListItem>
      
      <Divider />
      
      <ListItem component={NavLink} to="/settings">
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        <ListItemText primary="Settings" />
      </ListItem>
    </List>
  );
};

export default SidebarNav;
