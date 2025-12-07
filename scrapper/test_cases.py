import datetime
import json
import pyperclip

today = datetime.datetime.now().date()
one_day_later = today + datetime.timedelta(days=1)
three_days_later = today + datetime.timedelta(days=3)
one_week_later = today + datetime.timedelta(days=7)
ten_days_later = today + datetime.timedelta(days=10)

input_test_data = {"requests": [
    {
        "requested_by_user_id": "1",
        "type": "",
        "from_destination": "SYZ",
        "from_date": one_day_later.strftime("%Y-%m-%d"),
        "to_destination": "THR",
        "to_date": "",
        "is_foreign_flight": False
    },
    {
        "requested_by_user_id": "2",
        "type": "",
        "from_destination": "THR",
        "from_date": three_days_later.strftime("%Y-%m-%d"),
        "to_destination": "MHD",
        "to_date": "",
        "is_foreign_flight": False
    },
    {
        "requested_by_user_id": "3",
        "type": "",
        "from_destination": "IFN",
        "from_date": one_week_later.strftime("%Y-%m-%d"),
        "to_destination": "DXB",
        "to_date": (one_week_later + datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
        "is_foreign_flight": True
    },
    {
        "requested_by_user_id": "4",
        "type": "",
        "from_destination": "TBZ",
        "from_date": ten_days_later.strftime("%Y-%m-%d"),
        "to_destination": "ESB",
        "to_date": (ten_days_later + datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
        "is_foreign_flight": True
    }
]
}

# Convert to JSON string with proper formatting
json_data = json.dumps(input_test_data, indent=2)

# Copy to clipboard
pyperclip.copy(json_data)

# Print confirmation message
print("JSON data has been copied to your clipboard! You can now paste it anywhere.")