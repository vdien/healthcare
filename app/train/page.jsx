'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import Papa from 'papaparse';
import { 
  Upload, 
  Search, 
  Loader2, 
  X, 
  Check, 
  Copy,
  Pencil,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrainPage() {
  const { userId } = useAuth();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [knowledge, setKnowledge] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    'Dinh dưỡng',
    'Tập luyện',
    'Bệnh thường gặp',
    'Sức khỏe tâm thần',
    'Chăm sóc trẻ em',
    'Chăm sóc người già'
  ];

  const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  if (!selectedFile) return;

  setFile(selectedFile);

  Papa.parse(selectedFile, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',
    delimiter: ',', // Rõ ràng chỉ định dấu phân cách
    quoteChar: '"', // Xác định ký tự trích dẫn
    complete: (results) => {
      if (results.errors.length > 0) {
        toast.error(`Lỗi CSV: ${results.errors[0].message}`);
        return;
      }
      
      // Validate required fields
      const requiredFields = ['title', 'description', 'content', 'category'];
      const missingFields = requiredFields.filter(field => 
        !results.meta.fields.includes(field)
      );

      if (missingFields.length > 0) {
        toast.error(`Thiếu trường bắt buộc: ${missingFields.join(', ')}`);
        return;
      }

      setPreviewData(results.data.slice(0, 5));
      setIsModalVisible(true);
    },
    error: (error) => {
      toast.error(`Lỗi đọc file: ${error.message}`);
    }
  });
};

  const handleImport = async () => {
    if (!file || !userId) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Đã import thành công ${result.count} mục kiến thức`);
        fetchKnowledge();
      } else {
        toast.error(`Lỗi khi import: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Lỗi khi gửi file: ${error.message}`);
    } finally {
      setIsImporting(false);
      setIsModalVisible(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchKnowledge = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('query', searchQuery);
      if (categoryFilter) queryParams.append('category', categoryFilter);

      const response = await fetch(`/api/knowledge?${queryParams.toString()}`);
      const result = await response.json();

      if (result.success) {
        setKnowledge(result.data);
      } else {
        toast.error(`Lỗi khi lấy dữ liệu: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Lỗi kết nối: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Quản lý Kiến thức Sức khỏe</h1>
      
      {/* Upload Section */}
      <div className="bg-[#2A2B32] p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Import kiến thức từ CSV</h2>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="bg-[#10A37F] hover:bg-[#0d8a6d] text-white px-4 py-2 rounded cursor-pointer flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Chọn file CSV
          </label>
          {file && (
            <span className="text-gray-300">{file.name}</span>
          )}
        </div>
        <p className="text-gray-400 mt-2">
          File CSV cần có các cột: title, description, content, category (tùy chọn: tags, source)
        </p>
      </div>

      {/* Knowledge List Section */}
      <div className="bg-[#2A2B32] p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold text-white">Kiến thức hiện có</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#40414F] text-white pl-10 pr-4 py-2 rounded w-full focus:outline-none"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#40414F] text-white px-4 py-2 rounded w-full focus:outline-none appearance-none"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button 
              onClick={fetchKnowledge}
              disabled={isLoading}
              className="bg-[#10A37F] hover:bg-[#0d8a6d] text-white px-4 py-2 rounded flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tải...
                </>
              ) : 'Tìm kiếm'}
            </button>
          </div>
        </div>

        {/* Knowledge Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left">Tiêu đề</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-left">Danh mục</th>
                <th className="px-4 py-3 text-left">Tags</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {knowledge.map(item => (
                <tr key={item._id} className="border-b border-gray-700 hover:bg-[#40414F]">
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">
                    {item.description}
                  </td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.map(tag => (
                        <span key={tag} className="bg-[#40414F] px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {knowledge.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-400">
              Không có dữ liệu kiến thức
            </div>
          )}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#10A37F]" />
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2B32] rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Xem trước dữ liệu CSV</h3>
              <button 
                onClick={() => setIsModalVisible(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-300 mb-4">
              Bạn có muốn import {previewData.length} mục dữ liệu sau?
            </p>
            
            <div className="space-y-4 mb-6">
              {previewData.map((row, i) => (
                <div key={i} className="bg-[#40414F] p-4 rounded-lg">
                  <h4 className="font-medium text-white">
                    {row.title || '(Không có tiêu đề)'}
                  </h4>
                  <p className="text-gray-300 text-sm mt-1">
                    {row.description || '(Không có mô tả)'}
                  </p>
                  <div className="flex mt-2 text-xs text-gray-400 space-x-4">
                    <span>Danh mục: {row.category || '(Không có)'}</span>
                    <span>Tags: {row.tags || '(Không có)'}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalVisible(false)}
                className="px-4 py-2 rounded border border-gray-600 text-white hover:bg-gray-700 flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="bg-[#10A37F] hover:bg-[#0d8a6d] text-white px-4 py-2 rounded flex items-center"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang import...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Xác nhận import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}