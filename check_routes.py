from app import create_app

app = create_app('development')
with app.app_context():
    print("Available routes:")
    for rule in app.url_map.iter_rules():
        print(f'{rule.rule} -> {rule.endpoint} ({list(rule.methods)})')
