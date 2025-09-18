def map_plan_billing_cycle_to_user(plan_name):
    """Map plan name to billing cycle for user display"""
    billing_cycles = {
        'basic': 'MONTHLY',
        'premium': 'MONTHLY', 
        'pro': 'MONTHLY',
        'enterprise': 'MONTHLY',
        'annual_basic': 'ANNUALLY',
        'annual_premium': 'ANNUALLY',
        'annual_pro': 'ANNUALLY',
        'annual_enterprise': 'ANNUALLY'
    }
    return billing_cycles.get(plan_name.lower(), 'MONTHLY')
