# gNB EMC Dashboard API Documentation Generator

This module provides local Swagger/OpenAPI documentation for the gNB EMC Dashboard API using Flasgger. It runs completely separately from your main Flask.py backend application.

## Features

- 🚀 **Independent Operation** - Runs separately from your main Flask backend
- 📱 **Interactive Swagger UI** - Test APIs directly from the browser
- 🎯 **Real Backend Testing** - All requests go to your actual backend server
- 🔧 **Configurable** - Customize backend IP, ports, and settings
- 📖 **Comprehensive Documentation** - Complete API reference with examples
- 💻 **Windows Friendly** - Easy-to-use batch launcher included

## Quick Start

### Method 1: Double-click Launcher (Easiest)
1. Navigate to `backend/docs_generator/`
2. Double-click `start_docs.bat`
3. Your browser will automatically open to the Swagger UI

### Method 2: Command Line
```bash
cd backend/docs_generator
python swagger_docs.py
```

### Method 3: Custom Configuration
```bash
# Specify custom backend IP
python swagger_docs.py 192.168.1.50

# Specify backend IP and ports
python swagger_docs.py 192.168.1.50 5000 9000
```

## Configuration

### Default Settings
- **Backend IP**: 192.168.1.100
- **Backend Port**: 5000
- **Local Documentation Port**: 8080

### Command Line Arguments
```bash
python swagger_docs.py [backend_ip] [backend_port] [local_port]
```

**Examples:**
```bash
# Use different backend IP
python swagger_docs.py 192.168.1.50

# Use different backend IP and port
python swagger_docs.py 192.168.1.50 8000

# Customize all settings
python swagger_docs.py 192.168.1.50 8000 9090
```

## Usage

### Accessing Documentation
Once started, the documentation is available at:
- **Swagger UI**: http://localhost:8080/docs/
- **OpenAPI JSON**: http://localhost:8080/apispec.json
- **Server Info**: http://localhost:8080/

### Testing APIs
1. **Browse Documentation** - View all available endpoints
2. **Try it Out** - Click "Try it out" on any endpoint  
3. **Fill Parameters** - Enter required parameters or JSON body
4. **Execute** - Click "Execute" to send request to your backend
5. **View Response** - See the actual response from your backend

**⚠️ Important: All API testing sends real HTTP requests to your backend server at the configured IP address (e.g., 192.168.2.100:5000). You will see actual responses, errors, or network failures from your real Flask backend.**

### What You'll See When Testing:
- **✅ Backend Online & Working**: Real data from your gNB node
- **❌ Backend Offline**: Network connection errors  
- **⚠️ Backend Has Issues**: Actual error responses (400, 500, etc.)
- **🔧 API Bugs**: Real error messages to help debug

### Network Requirements:
- Your local computer must have network access to your backend IP
- Same connectivity requirements as using curl or Postman
- Firewall/security settings may need to allow connections

### Copying Commands
Each endpoint shows curl commands that you can copy and run in your terminal, automatically configured with your backend IP.

## File Structure

```
docs_generator/
├── __init__.py           # Package initialization
├── swagger_docs.py       # Main documentation server
├── start_docs.bat        # Windows launcher script
└── README.md            # This documentation
```

## Dependencies

Required Python packages (automatically installed):
- `flask` - Web framework for the documentation server
- `flasgger` - Swagger/OpenAPI integration for Flask

## API Endpoints Documented

### Board Management
- `GET /api/board-info` - Get board information and configuration

### Monitoring  
- `GET /api/attributes` - Get comprehensive system metrics
- `GET /api/node_status` - Get current node operational status

### Control
- `POST /api/setup_script` - Execute node control commands (start/stop/status)

### Configuration
- `POST /api/config` - Update gNB configuration parameters

### File Management
- `GET /api/download/<file_key>` - Download configuration files and logs

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Use a different local port
python swagger_docs.py 192.168.1.100 5000 8081
```

**Backend Not Responding**
- Ensure your Flask backend is running on the specified IP/port
- Check firewall settings
- Verify network connectivity

**Python Packages Missing**
```bash
pip install flask flasgger
```

**Browser Not Opening**
- Manually navigate to http://localhost:8080/docs/
- Check if antivirus is blocking the browser launch

### Testing Without Backend

The documentation server works even if your backend is offline:
- **Documentation** - Always available for reference
- **API Testing** - Will show connection errors (expected behavior)
- **Schema Reference** - Request/response formats always visible

## Integration with Main Application

This documentation system is **completely separate** from your main Flask.py application:

- ✅ **No modifications needed** to your existing Flask backend
- ✅ **Zero dependencies added** to your production system  
- ✅ **Independent operation** - Can run while backend is offline
- ✅ **Safe testing environment** - Won't interfere with your backend

## Development

### Adding New Endpoints

To document new API endpoints:

1. **Add route definition** in `swagger_docs.py`
2. **Add @swag_from decorator** with documentation
3. **Update backend URL** in description
4. **Restart documentation server**

Example:
```python
@self.app.route("/api/new-endpoint", methods=["GET"])
@swag_from({
    'tags': ['New Category'],
    'summary': 'New Endpoint',
    'description': f'Description with backend URL: {self.backend_url}/api/new-endpoint',
    'responses': {
        200: {
            'description': 'Success',
            'schema': {'type': 'object', 'properties': {...}}
        }
    }
})
def new_endpoint():
    return {"message": "Documentation only"}
```

### Customizing Appearance

Modify the `swagger_template` in `swagger_docs.py` to customize:
- API title and description
- Contact information  
- Version numbers
- Tag definitions

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your backend is accessible at the specified IP/port
3. Ensure Python and required packages are installed
4. Check console output for error messages

## License

This documentation generator is part of the gNB EMC Dashboard project.