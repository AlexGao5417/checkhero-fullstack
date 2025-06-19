import React, { useState, useEffect } from 'react';
import LoginPage from './components/Auth/LoginPage';
import StepWrapper from './components/Form/StepWrapper';
import InputField from './components/Form/InputField';
import TextAreaField from './components/Form/TextAreaField';
import CheckboxField from './components/Form/CheckboxField';
import ImageDropzone from './components/Form/ImageDropzone';
import { initialFormData } from './utils/formInitialState';
import { downloadPdfFromBackend } from './utils/downloadPdf';
import UserManagement from './components/Auth/UserManagement';
import ReportsTable from './components/Reports/ReportsTable';

const App = () => {
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
    const [activeSection, setActiveSection] = useState('form');
    const [formData, setFormData] = useState(() => {
        try {
            const savedData = localStorage.getItem('checkheroFormData');
            return savedData ? JSON.parse(savedData) : initialFormData;
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
    const [addressWarning, setAddressWarning] = useState('');
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState('');
    const [currentUser, setCurrentUser] = useState({ id: 101, user_type: 'admin' }); // Change user_type to 'electrician' to test logic
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
        const reader = new window.FileReader();
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
    const handleNextOrFinish = async () => {
        if (currentStep === 0 && !formData.propertyAddress.trim()) {
            setAddressWarning('Property Address is a required field!');
            setTimeout(() => {
                setAddressWarning('');
            }, 3000);
            return;
        }
        if (currentStep === totalSteps - 1) {
            setPdfLoading(true);
            setPdfError('');
            try {
                await downloadPdfFromBackend(formData);
                setPdfLoading(false);
                alert('PDF generated and download started!');
            } catch (err) {
                setPdfLoading(false);
                setPdfError(err.message || 'Failed to generate PDF');
            }
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
    const handleLoginClick = () => {
        setCurrentPage('login');
    };
    const handleSignOut = () => {
        setIsLoggedIn(false);
        setCurrentPage('main');
        console.log("User signed out.");
    };
    const handleSuccessfulSignIn = (token) => {
        setIsLoggedIn(true);
        setCurrentPage('main');
        if (token) {
            localStorage.setItem('checkheroToken', token);
        }
    };
    const handleClearAll = () => {
        setFormData(initialFormData);
        setCurrentStep(0);
        localStorage.removeItem('checkheroFormData');
        localStorage.removeItem('checkheroCurrentStep');
        console.log("All form fields cleared and progress reset.");
    };
    const handleEditReport = (report) => {
        setFormData(prev => ({
            ...prev,
            propertyAddress: report.address || '',
            reportDate: report.created_date || '',
            publisher: report.publisher || '',
            reviewer: report.reviewer || '',
            status: report.status || '',
            comment: report.comment || '',
            electricalSafetyCheck: report.electricalSafetyCheck ?? false,
            smokeSafetyCheck: report.smokeSafetyCheck ?? false,
            installationExtent: report.installationExtent || prev.installationExtent,
            visualInspection: report.visualInspection || prev.visualInspection,
            polarityTesting: report.polarityTesting || prev.polarityTesting,
            earthContinuityTesting: report.earthContinuityTesting || prev.earthContinuityTesting,
            rcdTestingPassed: report.rcdTestingPassed ?? false,
            smokeAlarmsWorking: report.smokeAlarmsWorking ?? false,
            nextSmokeAlarmCheckDate: report.nextSmokeAlarmCheckDate || '',
            smokeAlarmDetails: report.smokeAlarmDetails || [],
            observation: report.observation || '',
            recommendation: report.recommendation || '',
            images: report.images || [],
            electricalSafetyCheckCompletedBy: report.electricalSafetyCheckCompletedBy || '',
            licenceNumber: report.licenceNumber || '',
            inspectionDate: report.inspectionDate || '',
            nextInspectionDueDate: report.nextInspectionDueDate || '',
            signatureDate: report.signatureDate || '',
        }));
        setActiveSection('form');
        setCurrentStep(0);
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
                                    label={item.replace('Installation - ', '')}
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
                                    label={item.replace('Visual - ', '')}
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
                                    label={item.replace('Polarity - ', '')}
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
                                    label={item.replace('Earth - ', '')}
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
                            onClick={handleLoginClick}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                        >
                            <i className="fas fa-sign-in-alt mr-2"></i> Login
                        </button>
                    )}
                </div>
            </header>
            <div className="flex flex-1 flex-col md:flex-row">
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
                        <button
                            onClick={() => setActiveSection('reports')}
                            className={`w-full flex items-center justify-center md:justify-start py-3 px-5 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                                activeSection === 'reports' ? 'bg-blue-700 text-white shadow-lg' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                            <i className="fas fa-file-alt mr-0 md:mr-3 text-lg md:text-base"></i><span className="hidden md:inline">Reports</span>
                        </button>
                    </nav>
                </aside>
                <main className="flex-1 p-6 md:p-10 flex items-start justify-center">
                    <div className="bg-white rounded-2xl shadow-3xl p-6 md:p-10 w-full transition-all duration-300 ease-in-out transform hover:shadow-4xl" style={{ maxWidth: '1450px' }}>
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
                                        onClick={handleClearAll}
                                        className="px-8 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 flex items-center"
                                    >
                                        <i className="fas fa-broom mr-2"></i> Clear All
                                    </button>
                                    <button
                                        onClick={handleNextOrFinish}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {currentStep === totalSteps - 1 ? 'Finish' : 'Next'} <i className="fas fa-arrow-right ml-2"></i>
                                    </button>
                                </div>
                                {pdfLoading && (
                                    <div className="mt-6 text-blue-600 font-semibold text-center">Generating PDF, please wait...</div>
                                )}
                                {pdfError && (
                                    <div className="mt-6 text-red-600 font-semibold text-center">{pdfError}</div>
                                )}
                            </>
                        )}
                        {activeSection === 'user-management' && (
                            <UserManagement />
                        )}
                        {activeSection === 'reports' && (
                            <ReportsTable currentUser={currentUser} onEditReport={handleEditReport} />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
