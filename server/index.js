import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Initialize
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// ============================================
// Middleware
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BoonraksaSystem API is running',
    timestamp: new Date().toISOString()
  });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();
    const productCount = await prisma.product.count();
    
    res.json({
      status: 'Connected',
      database: 'PostgreSQL',
      stats: {
        users: userCount,
        orders: orderCount,
        products: productCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: error.message
    });
  }
});

// ============================================
// Authentication Routes
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก username และ password'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username หรือ Password ไม่ถูกต้อง'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีนี้ถูกระงับการใช้งาน'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username หรือ Password ไม่ถูกต้อง'
      });
    }

    // Return user data (without password)
    const { password: _, ...userData } = user;
    
    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
});

// ============================================
// User Routes
// ============================================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    // Validation
    if (!username || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username นี้มีอยู่ในระบบแล้ว'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้สำเร็จ',
      data: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
    });
  }
});

// ============================================
// Order Routes
// ============================================

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status, salesId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (salesId) where.salesId = parseInt(salesId);

    const orders = await prisma.order.findMany({
      where,
      include: {
        sales: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        graphic: {
          select: {
            id: true,
            name: true
          }
        },
        qc: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์'
    });
  }
});

// Get single order
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        sales: true,
        graphic: true,
        qc: true,
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        logs: {
          include: {
            user: {
              select: {
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์นี้'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์'
    });
  }
});

// ============================================
// Product Routes
// ============================================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true
      }
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า'
    });
  }
});

// Get low stock items
app.get('/api/products/low-stock', async (req, res) => {
  try {
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: {
          lte: prisma.productVariant.fields.minStock
        }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: lowStockVariants
    });

  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสต็อกต่ำ'
    });
  }
});

// ============================================
// Category Routes
// ============================================

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่'
    });
  }
});

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'ไม่พบ API endpoint นี้'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดในระบบ',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 BoonraksaSystem API Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
  console.log('Available endpoints:');
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/db-test`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/users`);
  console.log(`  POST /api/users`);
  console.log(`  GET  /api/orders`);
  console.log(`  GET  /api/orders/:id`);
  console.log(`  GET  /api/products`);
  console.log(`  GET  /api/categories`);
  console.log('='.repeat(50));
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});