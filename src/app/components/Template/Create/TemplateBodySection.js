'use client';

import React from 'react';
import { Paper, TextField, Box } from '@mui/material';
import TemplateBodyInput from './TemplateBodyInput';

const TemplateBodySection = ({
    styles,
    body,
    templateType,
    saveError,
    bodyCharCount,
    emojiPickerOpen,
    variableKeys,
    variableValues,
    onBodyChange,
    onToggleEmoji,
    onEmojiSelect,
    onAddVariablePlaceholder,
    onVariableValueChange,
    textareaRef,
}) => {
    return (
        <Paper elevation={0} className={styles.sectionCard} sx={{ p: 2.5, mb: 2, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 className={styles.sectionTitle}>Body <span style={{ color: 'red' }}>*</span></h3>
            <p className={styles.sectionSubtitle}>Enter the text for your message in the language that you've selected.</p>
            <TemplateBodyInput
                value={body}
                onChange={(value) => onBodyChange(value)}
                placeholder="Enter body text"
                minRows={1}
                maxRows={12}
                maxLength={1024}
                error={saveError === 'Template body is required.'}
                helperText={saveError === 'Template body is required.' ? 'This field is required' : ''}
                showCharCounter={true}
                showFormatting={true}
                showEmoji={true}
                showVariableButton={true}
                emojiPickerOpen={emojiPickerOpen}
                onToggleEmoji={onToggleEmoji}
                onEmojiSelect={onEmojiSelect}
                onAddVariablePlaceholder={onAddVariablePlaceholder}
                styles={styles}
                textareaRef={textareaRef}
            />
            {variableKeys.length > 0 && (
                <Box className={styles.variableSection}>
                    <span className={styles.variableTitle} style={{ display: 'block', marginBottom: '8px' }}>Sample variable values</span>
                    <Box className={styles.variableInputList}>
                        {variableKeys.map((key) => (
                            <TextField
                                key={key}
                                fullWidth
                                size="small"
                                label={`{{${key}}} sample`}
                                value={variableValues[key] || ''}
                                onChange={(e) => onVariableValueChange(key, e.target.value)}
                                placeholder="e.g. John"
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
};

export default TemplateBodySection;
