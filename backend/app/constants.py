ADMIN = 1
AGENT = 2
USER = 3 # Assuming 'user' is a general user type 

ELECTRICITY_AND_SMOKE_REPORT_TYPE = 1
GAS_REPORT_TYPE = 2
SMOKE_REPORT_TYPE = 3

DRAFT = 'draft'
APPROVED = 'approved'
DENIED = 'denied'
PENDING = 'pending'

actionTypes = {
    'create': 'CREATE',
    'update': 'UPDATE',
    'approve': 'APPROVE',
    'decline': 'DECLINE',
    'delete': 'DELETE',
    'login': 'LOGIN',
    'register': 'REGISTER',
    'withdraw': 'WITHDRAW',
    'assign_address': 'ASSIGN_ADDRESS',
    'edit_address': 'EDIT_ADDRESS',
    'remove_address': 'REMOVE_ADDRESS',
    'set_affiliate': 'SET_AFFILIATE',
}

targetTypes = {
    'report': 'REPORT',
    'user': 'USER',
    'address': 'ADDRESS',
    'withdraw': 'WITHDRAW',
    'address_agent': 'ADDRESS_AGENT',
}