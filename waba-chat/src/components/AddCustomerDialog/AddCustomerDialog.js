import React, { useState, useEffect, useCallback } from 'react';
import {
    Button,
    Box
} from '@mui/material';
import { addCustomer } from '../../API/AddCustomer/AddCustomer';
import toast from 'react-hot-toast';
import CustomerModal from '../ReusableComponent/CustomerModal';
import CustomTextField from '../ReusableComponent/CustomTextField';

const AddCustomerDialog = ({
    open,
    onClose,
    selectedMember,
    onSuccess
}) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [debouncedFirstName, setDebouncedFirstName] = useState('');
    const [debouncedLastName, setDebouncedLastName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFirstName(firstName);
            setDebouncedLastName(lastName);
        }, 300);

        return () => clearTimeout(timer);
    }, [firstName, lastName]);

    const handleSaveCustomer = useCallback(async () => {
        if (!selectedMember?.CustomerPhone) {
            toast.error("Missing customer phone number. Cannot add customer.");
            return;
        }

        if (!debouncedFirstName.trim()) {
            toast.error("Please enter a first name.");
            return;
        }

        if (!debouncedLastName.trim()) {
            toast.error("Please enter a last name.");
            return;
        }

        setLoading(true);
        try {
            const response = await addCustomer(
                selectedMember.CustomerPhone,
                selectedMember?.userId || 1,
                debouncedFirstName.trim(),
                debouncedLastName.trim(),
                selectedMember.ConversationId
            );

            if (response) {
                toast.success("Customer added successfully!");
                onSuccess?.();
                handleClose();
            } else {
                toast.error("Failed to add customer");
            }
        } catch (error) {
            console.error("Error adding customer", error);
            toast.error("Something went wrong while adding the customer.");
        } finally {
            setLoading(false);
        }
    }, [selectedMember, debouncedFirstName, debouncedLastName, onSuccess]);

    const handleClose = useCallback(() => {
        setFirstName('');
        setLastName('');
        setDebouncedFirstName('');
        setDebouncedLastName('');
        setLoading(false);
        onClose();
    }, [onClose]);

    const handleFirstNameChange = useCallback((e) => {
        setFirstName(e.target.value);
    }, []);

    const handleLastNameChange = useCallback((e) => {
        setLastName(e.target.value);
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !loading && debouncedFirstName.trim() && debouncedLastName.trim()) {
            e.preventDefault();
            handleSaveCustomer();
        }
    }, [handleSaveCustomer, loading, debouncedFirstName, debouncedLastName]);

    return (
        <CustomerModal
            open={open}
            onClose={handleClose}
            title="Add Customer"
            actions={
                <>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        color="secondary"
                        disabled={loading}
                        className='secondaryBtnClassname'
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveCustomer}
                        variant="contained"
                        disableElevation
                        disabled={!debouncedFirstName.trim() || !debouncedLastName.trim() || loading}
                        className='primaryBtnClassname'
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </>
            }
        >
            <Box>
                <CustomTextField
                    label="Mobile Number"
                    value={selectedMember?.CustomerPhone || ''}
                    disabled
                    margin="normal"
                    sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'action.hover',
                        },
                    }}
                />

                <CustomTextField
                    label="First Name"
                    value={firstName}
                    onChange={handleFirstNameChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter first name"
                    disabled={loading}
                    autoFocus
                    margin="normal"
                />

                <CustomTextField
                    label="Last Name"
                    value={lastName}
                    onChange={handleLastNameChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter last name"
                    disabled={loading}
                    margin="normal"
                />
            </Box>
        </CustomerModal>
    );
};

export default AddCustomerDialog;
