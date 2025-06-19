import React, { useState, useEffect, useRef, useCallback } from 'react';

// Initial state for form data
const initialFormData = {
    propertyAddress: '',
    reportDate: '',
    electricalSafetyCheck: false,
    smokeSafetyCheck: false,
    installationExtent: {
        'Main Switchboard': false,
        'Other living areas': false,
        'Main earthing system': false,
        'Laundry': false,
        'Kitchen': false,
        'Garage': false,
        'Bathroom (main)': false,
        'Solar/battery system': false,
        'Other bathrooms/ensuites': false,
        'Installation - Electric water heater': false, // Made unique
        'Bedroom (main)': false,
        'Installation - Dishwasher': false, // Made unique
        'Other bedrooms': false,
        'Installation - Electric room/space heaters': false, // Made unique
        'Living room': false,
        'Installation - Swimming pool equipment': false, // Made unique
    },
    visualInspection: {
        'Visual - Consumers mains': false, // Made unique
        'Visual - Space heaters': false, // Made unique
        'Visual - Switchboards': false, // Made unique
        'Visual - Cooking equipment': false, // Made unique
        'Visual - Exposed earth electrode': false, // Made unique
        'Visual - Dishwasher': false, // Made unique
        'Visual - Metallic water pipe bond': false, // Made unique
        'Visual - Exhaust fans': false, // Made unique
        'Visual - RCDs (Safety switches)': false, // Made unique
        'Visual - Celling fans': false, // Made unique
        'Visual - Circuit protection (circuit breakers/fuses)': false, // Made unique
        'Visual - Washing machinedryer/': false, // Made unique
        'Visual - Socket-outlets': false, // Made unique
        'Visual - Installation wiring': false, // Made unique
        'Visual - Light fittings': false, // Made unique
        'Visual - Solar and other renewable systems': false, // Made unique
        'Visual - Electric water heater': false, // Made unique
        'Visual - Swimming pool equipment': false, // Made unique
        'Visual - Air conditioners': false, // Made unique
        'Visual - Vehicle chargers': false, // Made unique
    },
    polarityTesting: {
        'Polarity - Consumers mains': false, // Made unique
        'Polarity - Electric water heater': false, // Made unique
        'Polarity - Circuit protection (circuit breakers/fuses)': false, // Made unique
        'Polarity - Air conditioners': false, // Made unique
        'Polarity - RCDs (Safety switches)': false, // Made unique
        'Polarity - Cooking equipment': false, // Made unique
        'Polarity - Dishwasher': false, // Made unique
        'Polarity - Circuit protection (circuit breakers/fuses) (D2)': false, // Made unique and kept D2
        'Polarity - Solar and other renewable systems': false, // Made unique
        'Polarity - Socket-outlets': false, // Made unique
        'Polarity - Swimming pool equipment': false, // Made unique
        'Polarity - Vehicle chargers': false, // Made unique
    },
    earthContinuityTesting: {
        'Earth - Mains earth conductor': false, // Made unique
        'Earth - Electric water heater': false, // Made unique
        'Earth - Metallic water pipe bond': false, // Made unique
        'Earth - Air conditioners': false, // Made unique
        'Earth - Socket-outlets': false, // Made unique
        'Earth - Cooking equipment': false, // Made unique
        'Earth - Light fittings': false, // Made unique
        'Earth - Dishwasher': false, // Made unique
        'Earth - Exhaust fans': false, // Made unique
        'Earth - Solar and other renewable systems': false, // Made unique
        'Earth - Celling fans': false, // Made unique
        'Earth - Swimming pool equipment': false, // Made unique
        'Earth - Vehicle chargers': false, // Made unique
    },
    rcdTestingPassed: false,
    smokeAlarmsWorking: false,
    nextSmokeAlarmCheckDate: '',
    smokeAlarmDetails: [],
    observation: '',
    recommendation: '',
    images: [],
    electricalSafetyCheckCompletedBy: '',
    licenceNumber: '',
    inspectionDate: '',
    nextInspectionDueDate: '',
    signatureDate: '',
};


// Login Page Component
const LoginPage = ({ onSignIn, onGoBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSignInClick = () => {
        // In a real application, you would send email/password to a backend for authentication.
        // For this simulation, we'll just check if fields are non-empty.
        if (email && password) {
            setMessage('Simulating login... Success!');
            setTimeout(() => {
                onSignIn(); // Call the parent function to set isLoggedIn to true
            }, 1000);
        } else {
            setMessage('Please enter both email and password.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 font-inter antialiased p-4">
            <div className="bg-white rounded-2xl shadow-3xl p-8 md:p-12 w-full max-w-md text-center">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Login to CheckHero</h2>
                <p className="text-gray-600 mb-8">Enter your credentials to access the report generator.</p>

                <InputField
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                />
                <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                />

                {message && (
                    <p className={`mt-4 text-sm font-semibold ${message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}

                <button
                    onClick={handleSignInClick}
                    className="mt-8 w-full px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-lg font-semibold"
                >
                    <i className="fas fa-sign-in-alt mr-3"></i> Sign In
                </button>

                <button
                    onClick={onGoBack}
                    className="mt-4 w-full px-6 py-3 bg-gray-300 text-gray-800 rounded-full shadow-md hover:bg-gray-400 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-lg font-semibold"
                >
                    <i className="fas fa-arrow-left mr-3"></i> Go Back
                </button>
            </div>
        </div>
    );
};

// Main App Component
const App = () => {
    // currentPage can be 'main' or 'login'
    const [currentPage, setCurrentPage] = useState('main');
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        try {
            const savedLoginState = localStorage.getItem('checkheroIsLoggedIn');
            return savedLoginState ? JSON.parse(savedLoginState) : false;
        } catch (error) {
            console.error("Failed to parse localStorage isLoggedIn:", error);
            return false;
        }
    });
    const [activeSection, setActiveSection] = useState('form'); // 'form' or 'user-management'

    const [formData, setFormData] = useState(() => {
        try {
            const savedData = localStorage.getItem('checkheroFormData');
            return savedData ? JSON.parse(savedData) : initialFormData; // Use initialFormData
        } catch (error) {
            console.error("Failed to parse localStorage data:", error);
            return initialFormData;
        }
    });

    const [currentStep, setCurrentStep] = useState(() => {
        try {
            const savedStep = localStorage.getItem('checkheroCurrentStep');
            return savedStep ? parseInt(savedStep, 10) : 0;
        } catch (error) {
            console.error("Failed to parse localStorage step:", error);
            return 0;
        }
    });

    // State for address validation warning
    const [addressWarning, setAddressWarning] = useState('');

    // Save form data, current step, and login state to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('checkheroFormData', JSON.stringify(formData));
            localStorage.setItem('checkheroCurrentStep', currentStep.toString());
            localStorage.setItem('checkheroIsLoggedIn', JSON.stringify(isLoggedIn));
        } catch (error) {
            console.error("Failed to save to localStorage:", error);
        }
    }, [formData, currentStep, isLoggedIn]);

    const handleFormChange = (section, field, value) => {
        if (section) {
            setFormData(prevData => ({
                ...prevData,
                [section]: {
                    ...prevData[section],
                    [field]: value
                }
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                [field]: value
            }));
        }
    };

    const handleImageUpload = (index, file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prevData => {
                const newImages = [...prevData.images];
                newImages[index] = reader.result;
                return { ...prevData, images: newImages };
            });
        };
        if (file) {
            reader.readAsDataURL(file);
        }
    };

    const addImageDropzone = () => {
        setFormData(prevData => ({
            ...prevData,
            images: [...prevData.images, null]
        }));
    };

    const removeImageDropzone = (indexToRemove) => {
        setFormData(prevData => ({
            ...prevData,
            images: prevData.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const totalSteps = 6;

    const handleNextOrFinish = () => {
        // Validate propertyAddress only on the first step
        if (currentStep === 0 && !formData.propertyAddress.trim()) {
            setAddressWarning('Property Address is a required field!');
            setTimeout(() => {
                setAddressWarning('');
            }, 3000); // Warning disappears after 3 seconds
            return; // Prevent navigation
        }

        if (currentStep === totalSteps - 1) {
            // This is the "Finish" step
            const jsonOutput = JSON.stringify(formData, null, 2); // Prettify JSON output
            console.log("--- Generated JSON Data ---");
            console.log(jsonOutput);
            alert("Form finished and JSON data logged to console! Check your browser's developer console for the JSON output.");
            // In a real application, you would send this JSON to a backend for PDF generation
            // or trigger a local PDF generation process.
        } else {
            // Navigate to the next step
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleLoginClick = () => {
        setCurrentPage('login');
    };

    const handleSignOut = () => {
        setIsLoggedIn(false);
        setCurrentPage('main'); // Go back to main page after logout
        console.log("User signed out.");
    };

    const handleSuccessfulSignIn = () => {
        setIsLoggedIn(true);
        setCurrentPage('main');
    };

    // Function to clear all form fields and reset step
    const handleClearAll = () => {
        setFormData(initialFormData); // Reset to initial empty state
        setCurrentStep(0); // Go back to the first step
        localStorage.removeItem('checkheroFormData'); // Clear from localStorage
        localStorage.removeItem('checkheroCurrentStep'); // Clear from localStorage
        console.log("All form fields cleared and progress reset.");
    };

    const renderFormStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <StepWrapper title="Property Details & Check Outcomes">
                        <InputField label="Property Address" value={formData.propertyAddress} onChange={(e) => { handleFormChange(null, 'propertyAddress', e.target.value); setAddressWarning(''); }} warning={addressWarning} />
                        <InputField label="Date" type="date" value={formData.reportDate} onChange={(e) => handleFormChange(null, 'reportDate', e.target.value)} />

                        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Checks Conducted And Outcomes</h3>
                            <CheckboxField label="Electrical Safety Check" checked={formData.electricalSafetyCheck} onChange={(e) => handleFormChange(null, 'electricalSafetyCheck', e.target.checked)} />
                            <CheckboxField label="Smoke Safety Check" checked={formData.smokeSafetyCheck} onChange={(e) => handleFormChange(null, 'smokeSafetyCheck', e.target.checked)} />
                        </div>
                    </StepWrapper>
                );
            case 1:
                return (
                    <StepWrapper title="Section B: Extent of Installation & Limitations">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Tick parts included in safety check:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            {Object.keys(formData.installationExtent).map((item, index) => (
                                <CheckboxField
                                    key={index}
                                    label={item.replace('Installation - ', '')} // Display name without prefix
                                    checked={formData.installationExtent[item]}
                                    onChange={(e) => handleFormChange('installationExtent', item, e.target.checked)}
                                />
                            ))}
                        </div>
                    </StepWrapper>
                );
            case 2:
                return (
                    <StepWrapper title="Section C: Safety Check - Visual Inspection">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Visual Inspection Items:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            {Object.keys(formData.visualInspection).map((item, index) => (
                                <CheckboxField
                                    key={index}
                                    label={item.replace('Visual - ', '')} // Display name without prefix
                                    checked={formData.visualInspection[item]}
                                    onChange={(e) => handleFormChange('visualInspection', item, e.target.checked)}
                                />
                            ))}
                        </div>
                    </StepWrapper>
                );
            case 3:
                return (
                    <StepWrapper title="Section D: Safety Check - Testing">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Polarity And Correct Connections Testing:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            {Object.keys(formData.polarityTesting).map((item, index) => (
                                <CheckboxField
                                    key={index}
                                    label={item.replace('Polarity - ', '')} // Display name without prefix
                                    checked={formData.polarityTesting[item]}
                                    onChange={(e) => handleFormChange('polarityTesting', item, e.target.checked)}
                                />
                            ))}
                        </div>

                        <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4">Earth Continuity Testing:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            {Object.keys(formData.earthContinuityTesting).map((item, index) => (
                                <CheckboxField
                                    key={index}
                                    label={item.replace('Earth - ', '')} // Display name without prefix
                                    checked={formData.earthContinuityTesting[item]}
                                    onChange={(e) => handleFormChange('earthContinuityTesting', item, e.target.checked)}
                                />
                            ))}
                        </div>

                        <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4">RCD (residual-current device/safety switch) testing:</h3>
                        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            <CheckboxField label="All RCDs have passed push and time tests" checked={formData.rcdTestingPassed} onChange={(e) => handleFormChange(null, 'rcdTestingPassed', e.target.checked)} />
                        </div>
                    </StepWrapper>
                );
            case 4:
                return (
                    <StepWrapper title="Section E & F: Smoke Alarms & Observations">
                        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Smoke Alarms:</h3>
                            <CheckboxField label="All smoke alarm are correctly installed and in working condition; and have been tested according to the manufacturer's instructions." checked={formData.smokeAlarmsWorking} onChange={(e) => handleFormChange(null, 'smokeAlarmsWorking', e.target.checked)} />
                            <InputField label="Next smoke alarms check is due by" type="date" value={formData.nextSmokeAlarmCheckDate} onChange={(e) => handleFormChange(null, 'nextSmokeAlarmCheckDate', e.target.value)} />

                            <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-3 text-lg">Smoke Alarm Details:</h4>
                                {formData.smokeAlarmDetails.map((alarm, index) => (
                                    <div key={index} className="flex flex-wrap gap-4 items-end mb-4 p-4 bg-gray-100 rounded-lg shadow-sm border border-gray-200">
                                        <InputField
                                            label="Voltage"
                                            value={alarm.voltage || ''}
                                            onChange={(e) => {
                                                const newDetails = [...formData.smokeAlarmDetails];
                                                newDetails[index].voltage = e.target.value;
                                                handleFormChange(null, 'smokeAlarmDetails', newDetails);
                                            }}
                                            className="w-full sm:flex-1"
                                        />
                                        <InputField
                                            label="Status"
                                            value={alarm.status || ''}
                                            onChange={(e) => {
                                                const newDetails = [...formData.smokeAlarmDetails];
                                                newDetails[index].status = e.target.value;
                                                handleFormChange(null, 'smokeAlarmDetails', newDetails);
                                            }}
                                            className="w-full sm:flex-1"
                                        />
                                        <InputField
                                            label="Location"
                                            value={alarm.location || ''}
                                            onChange={(e) => {
                                                const newDetails = [...formData.smokeAlarmDetails];
                                                newDetails[index].location = e.target.value;
                                                handleFormChange(null, 'smokeAlarmDetails', newDetails);
                                            }}
                                            className="w-full sm:flex-1"
                                        />
                                        <InputField
                                            label="Level"
                                            value={alarm.level || ''}
                                            onChange={(e) => {
                                                const newDetails = [...formData.smokeAlarmDetails];
                                                newDetails[index].level = e.target.value;
                                                handleFormChange(null, 'smokeAlarmDetails', newDetails);
                                            }}
                                            className="w-full sm:flex-1"
                                        />
                                        <InputField
                                            label="Expiration"
                                            type="date"
                                            value={alarm.expiration || ''}
                                            onChange={(e) => {
                                                const newDetails = [...formData.smokeAlarmDetails];
                                                newDetails[index].expiration = e.target.value;
                                                handleFormChange(null, 'smokeAlarmDetails', newDetails);
                                            }}
                                            className="w-full sm:flex-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleFormChange(null, 'smokeAlarmDetails', formData.smokeAlarmDetails.filter((_, i) => i !== index))}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-md text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => handleFormChange(null, 'smokeAlarmDetails', [...formData.smokeAlarmDetails, {}])}
                                    className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                                >
                                    <i className="fas fa-plus mr-2"></i> Add Smoke Alarm
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Observations And Recommendations:</h3>
                            <TextAreaField label="Observation" value={formData.observation} onChange={(e) => handleFormChange(null, 'observation', e.target.value)} />
                            <TextAreaField label="Recommendation" value={formData.recommendation} onChange={(e) => handleFormChange(null, 'recommendation', e.target.value)} />
                        </div>
                    </StepWrapper>
                );
            case 5:
                return (
                    <StepWrapper title="Section G: Electrical Safety Check Certification & Images">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm mb-8">
                            <InputField label="Electrical Safety check completed by" value={formData.electricalSafetyCheckCompletedBy} onChange={(e) => handleFormChange(null, 'electricalSafetyCheckCompletedBy', e.target.value)} />
                            <InputField label="Licence/registration number" value={formData.licenceNumber} onChange={(e) => handleFormChange(null, 'licenceNumber', e.target.value)} />
                            <InputField label="Inspection date" type="date" value={formData.inspectionDate} onChange={(e) => handleFormChange(null, 'inspectionDate', e.target.value)} />
                            <InputField label="Next inspection due by" type="date" value={formData.nextInspectionDueDate} onChange={(e) => handleFormChange(null, 'nextInspectionDueDate', e.target.value)} />
                        </div>
                        <InputField label="Signature Date" type="date" value={formData.signatureDate} onChange={(e) => handleFormChange(null, 'signatureDate', e.target.value)} />

                        <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Images:</h3>
                            {formData.images.map((image, index) => (
                                <ImageDropzone key={index} index={index} onImageUpload={handleImageUpload} onRemove={removeImageDropzone} imageUrl={image} totalImages={formData.images.length} />
                            ))}
                            <button
                                type="button"
                                onClick={addImageDropzone}
                                className="mt-5 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center"
                            >
                                <i className="fas fa-plus mr-2"></i> Add More Images
                            </button>
                        </div>
                    </StepWrapper>
                );
            default:
                return null;
        }
    };

    if (currentPage === 'login') {
        return <LoginPage onSignIn={handleSuccessfulSignIn} onGoBack={() => setCurrentPage('main')} />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-inter antialiased">
            {/* Topbar */}
            <header className="w-full bg-gray-900 text-white p-4 shadow-lg flex justify-between items-center z-20">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold tracking-wide">CheckHero Dashboard</h1>
                </div>
                <div className="flex items-center space-x-4">
                    {isLoggedIn ? (
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors duration-200 flex items-center"
                        >
                            <i className="fas fa-sign-out-alt mr-2"></i> Sign Out
                        </button>
                    ) : (
                        <button
                            onClick={handleLoginClick} // Changed to handleLoginClick to switch page
                            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                        >
                            <i className="fas fa-sign-in-alt mr-2"></i> Login
                        </button>
                    )}
                </div>
            </header>

            <div className="flex flex-1 flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-gray-900 text-white p-6 shadow-2xl z-10 md:min-h-screen">
                    <h2 className="text-3xl font-extrabold mb-8 text-center tracking-wide text-blue-300">
                        <i className="fas fa-file-invoice mr-3"></i>CheckHero
                    </h2>
                    <nav className="space-y-4">
                        <button
                            onClick={() => setActiveSection('form')}
                            className={`w-full flex items-center justify-center md:justify-start py-3 px-5 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                                activeSection === 'form' ? 'bg-blue-700 text-white shadow-lg' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                            <i className="fas fa-clipboard-list mr-0 md:mr-3 text-lg md:text-base"></i><span className="hidden md:inline">Form Entry</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('user-management')}
                            className={`w-full flex items-center justify-center md:justify-start py-3 px-5 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                                activeSection === 'user-management' ? 'bg-blue-700 text-white shadow-lg' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                            <i className="fas fa-users mr-0 md:mr-3 text-lg md:text-base"></i><span className="hidden md:inline">User Management</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-6 md:p-10 flex items-start justify-center">
                    <div className="bg-white rounded-2xl shadow-3xl p-6 md:p-10 w-full max-w-4xl transition-all duration-300 ease-in-out transform hover:shadow-4xl">
                        {activeSection === 'form' && (
                            <>
                                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center tracking-tight leading-tight">Electrical & Smoke Safety Report</h1>
                                <div className="mb-10 w-full">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3 shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-in-out"
                                            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-center text-sm font-medium text-gray-600">Step {currentStep + 1} of {totalSteps}</div>
                                </div>

                                {renderFormStep()}

                                <div className="flex justify-between mt-10 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={prevStep}
                                        disabled={currentStep === 0}
                                        className="px-8 py-3 bg-gray-300 text-gray-800 rounded-full shadow-lg hover:bg-gray-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <i className="fas fa-arrow-left mr-2"></i> Previous
                                    </button>
                                    <button
                                        onClick={handleClearAll} // New Clear All button
                                        className="px-8 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 flex items-center"
                                    >
                                        <i className="fas fa-broom mr-2"></i> Clear All
                                    </button>
                                    <button
                                        onClick={handleNextOrFinish} // Changed to handleNextOrFinish
                                        className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {currentStep === totalSteps - 1 ? 'Finish' : 'Next'} <i className="fas fa-arrow-right ml-2"></i>
                                    </button>
                                </div>
                            </>
                        )}

                        {activeSection === 'user-management' && (
                            <div className="min-h-[400px] flex flex-col justify-center items-center p-8 bg-gray-50 rounded-xl shadow-inner border border-gray-200">
                                <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">User Management</h1>
                                <p className="text-lg text-gray-600 text-center max-w-md">
                                    This section is currently under development. Here, you'll be able to manage user accounts, roles, and permissions for the CheckHero application.
                                </p>
                                <div className="mt-8 p-5 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-center shadow-md flex items-center">
                                    <i className="fas fa-tools text-2xl mr-3"></i>
                                    <p className="font-semibold">Future enhancement: User authentication and comprehensive management features will be integrated here!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

// Reusable Components

const StepWrapper = ({ title, children }) => (
    <div className="mb-10 p-8 bg-white rounded-xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-2 pb-4 border-blue-200 text-center">{title}</h2>
        {children}
    </div>
);

const InputField = ({ label, type = 'text', value, onChange, className = '', placeholder = '', warning = '' }) => (
    <div className={`mb-5 ${className}`}>
        <label className="block text-gray-700 text-base font-semibold mb-2">
            {label}:
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-3 transition-all duration-200 text-lg
                ${warning ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400 focus:border-blue-400'}`}
            required={!!warning} // Make required if warning is possible
        />
        {warning && <p className="text-red-500 text-xs italic mt-2">{warning}</p>}
    </div>
);

const TextAreaField = ({ label, value, onChange }) => (
    <div className="mb-5">
        <label className="block text-gray-700 text-base font-semibold mb-2">
            {label}:
        </label>
        <textarea
            value={value}
            onChange={onChange}
            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 h-32 resize-y text-lg"
            required
        />
    </div>
);

const CheckboxField = ({ label, checked, onChange }) => (
    <div className="flex items-center mb-3 cursor-pointer select-none">
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="form-checkbox h-6 w-6 text-blue-600 rounded-md focus:ring-blue-500 transition-all duration-200 cursor-pointer border-gray-300"
        />
        <label className="ml-3 text-gray-800 text-lg cursor-pointer">
            {label}
        </label>
    </div>
);

const ImageDropzone = ({ index, onImageUpload, onRemove, imageUrl, totalImages }) => {
    const fileInputRef = useRef(null);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling up to parent click
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(index, file);
        } else {
            console.warn("Dropped file is not an image.");
            // Optionally show a user-friendly message
        }
    }, [index, onImageUpload]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(index, file);
        } else {
            console.warn("Selected file is not an image.");
            // Optionally show a user-friendly message
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div
            className="relative mb-6 p-8 border-2 border-dashed border-blue-300 rounded-xl text-center bg-blue-50 hover:bg-blue-100 transition-all duration-300 cursor-pointer group shadow-inner"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleBrowseClick}
        >
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
            />
            {imageUrl ? (
                <div className="flex flex-col items-center">
                    <img src={imageUrl} alt={`Uploaded ${index}`} className="max-w-full h-auto rounded-lg mb-4 shadow-lg border border-gray-200 transition-transform duration-300 group-hover:scale-102" style={{ maxHeight: '250px', objectFit: 'contain' }} />
                    <p className="text-base text-gray-700 font-medium">Click to change or drag and drop a new image.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
                    <svg className="mx-auto h-16 w-16 text-blue-400 group-hover:text-blue-600 transition-colors duration-300" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a2 2 0 00-2 2v20m32-12v8m0 0v8a2 2 0 01-2 2H12a2 2 0 01-2-2v-8m0 0l2.939-2.939A2 2 0 0115.414 16H32v2m-7 2H12m5-5h.01M32 28a6 6 0 100-12 6 6 0 000 12z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-3 text-lg text-gray-700 font-semibold">Drag 'n' drop an image here, or <span className="font-bold text-blue-600 group-hover:text-blue-800">click to select one</span></p>
                    <p className="text-sm text-gray-500 mt-1">(PNG, JPG, GIF up to 10MB)</p>
                </div>
            )}
            {totalImages > 1 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                    className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 shadow-md flex items-center justify-center transform hover:scale-110"
                    title="Remove image"
                >
                    <i className="fas fa-times text-lg"></i>
                </button>
            )}
        </div>
    );
};

export default App;

