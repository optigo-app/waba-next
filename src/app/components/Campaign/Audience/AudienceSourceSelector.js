import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { FilePlus, Users } from 'lucide-react';
import styles from './AudienceSection.module.scss';

const AudienceSourceSelector = ({ source, onSourceChange }) => {
  const handleSourceChange = (event, newSource) => {
    if (newSource !== null) {
      onSourceChange(newSource);
    }
  };


  return (
    <Box className={styles.section}>
      <Typography variant="subtitle1" className={styles.sectionTitle}>
        Select Audience Source
      </Typography>
      <ToggleButtonGroup
        value={source}
        exclusive
        onChange={handleSourceChange}
        aria-label="audience source"
        fullWidth
        className={styles.toggleButtonGroup}
      >
        <ToggleButton value="crm" aria-label="from crm" className={styles.toggleButton}>
          <Users size={18} /> &nbsp;
          From CRM
        </ToggleButton>
        <ToggleButton value="excel" aria-label="from excel" className={styles.toggleButton}>
          <FilePlus size={18} /> &nbsp;
          From Excel/CSV
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default AudienceSourceSelector;
