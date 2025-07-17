import axios from '../utils/Axios';

const bookmarkService = {
  // Get all bookmarks
  async getBookmarks() {
    const { data } = await axios.get('/bookmarks');
    return data;
  },

  // Add new bookmark
  async addBookmark(bookmarkData) {
    const { data } = await axios.post('/bookmarks', bookmarkData);
    return data;
  },

  // Delete bookmark
  async deleteBookmark(id) {
    await axios.delete(`/bookmarks/${id}`);
  },

  // Reorder bookmarks
  async reorderBookmarks(reorderData) {
    await axios.put('/bookmarks/reorder', reorderData);
  }
};

export default bookmarkService;
