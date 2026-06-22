'use client';

import React from 'react';
import { Box, TextField, Button, MenuItem } from '@mui/material';

const TemplateDetailsStepSection = ({
    styles,
    templateDetails,
    templateNameError,
    categoryCards,
    onTemplateNameChange,
    onTemplateLanguageChange,
    onTemplateCategoryChange,
    isCategoryLocked = false,
    isEditMode = false,
    onClose,
    onNext,
}) => {
    return (
        <Box className={styles.stepPanel}>
            <Box className={styles.inputSection}>
                <label className={styles.fieldLabel}>Template Name</label>
                <TextField
                    fullWidth
                    placeholder="e.g. summer_sale_offer"
                    value={templateDetails.templateName}
                    onChange={(e) => onTemplateNameChange(e.target.value)}
                    error={Boolean(templateNameError)}
                    helperText={templateNameError}
                    disabled={isEditMode}
                />
            </Box>

            <Box className={styles.inputSection}>
                <label className={styles.fieldLabel}>Template Language</label>
                <TextField
                    select
                    fullWidth
                    value={templateDetails.templateLanguage}
                    onChange={(e) => onTemplateLanguageChange(e.target.value)}
                    disabled={isEditMode}
                >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="en_US">English (US)</MenuItem>
                    <MenuItem value="en_GB">English (UK)</MenuItem>
                    <MenuItem value="hi">Hindi</MenuItem>
                    <MenuItem value="ar">Arabic</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="pt_BR">Portuguese (BR)</MenuItem>
                </TextField>
            </Box>

            <Box className={styles.inputSection}>
                <label className={styles.fieldLabel}>Template Category</label>
                <Box className={styles.infoNotification}>
                    Info: Image and Carousel templates should use the Marketing category.
                </Box>
                <Box className={styles.categoryList} sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {categoryCards.map((card) => {
                        const { Icon } = card;
                        const isSelected = templateDetails.templateCategory === card.key;
                        return (
                            <Button
                                key={card.key}
                                className={`${styles.categoryCardFull} ${isSelected ? styles.selectedCategoryFull : ''}`}
                                disabled={isCategoryLocked}
                                onClick={() => onTemplateCategoryChange(card.key)}
                            >
                                <Box className={styles.categoryIconWrap}>
                                    <Icon size={20} />
                                </Box>
                                <Box sx={{ flex: 1, textAlign: 'left' }}>
                                    <span className={styles.categoryTitle}>{card.key}</span>
                                    <p className={styles.categoryDesc}>{card.description}</p>
                                </Box>
                            </Button>
                        );
                    })}
                </Box>
            </Box>

            <Box className={styles.stepFooter}>
                <Button variant="outlined" onClick={onClose} className={styles.cancelBtn}>
                    Cancel
                </Button>
                <Button variant="contained" className={styles.primaryBtn} onClick={onNext}>
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default TemplateDetailsStepSection;
