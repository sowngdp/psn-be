#!/bin/bash

# Kiểm tra xem mongodb đã chạy chưa
mongo_running=$(pgrep mongod)

if [ -z "$mongo_running" ]; then
  echo "Starting MongoDB..."
  
  # Tạo thư mục data nếu chưa tồn tại
  mkdir -p ./data/db
  
  # Khởi động MongoDB với đường dẫn cụ thể
  mongod --dbpath ./data/db &
  
  echo "MongoDB started successfully."
else
  echo "MongoDB is already running."
fi

# Đợi một chút để đảm bảo MongoDB đã khởi động hoàn toàn
sleep 3

# Tạo database và collections cần thiết
echo "Creating initial database structure..."
mongo --eval "
  use personal-style-network;
  db.createCollection('users');
  db.createCollection('items');
  db.createCollection('outfits');
  db.createCollection('style-rules');
  db.createCollection('recommendations');
  db.createCollection('userstyleprofiles');
  print('Database structure created successfully.');
"

echo "MongoDB setup completed." 