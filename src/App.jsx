import { useState, useEffect } from 'react';

const APITester = () => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || '');
  const [results, setResults] = useState({});
  const [formData, setFormData] = useState({
    regUsername: 'testuser',
    regPassword: 'testpass',
    regEmail: 'test@example.com',
    loginUsername: 'alice',
    loginPassword: 'alice_pw',
    itemName: 'Sample Item',
    itemDescription: 'This is a sample item description',
    itemId: '',
    reviewItemId: '',
    reviewText: 'This is a great product!',
    reviewRating: 5,
    reviewsByItemId: '',
    reviewsByUserId: '',
    commentReviewId: '',
    commentText: 'I agree with this review!',
    commentsByUserId: ''
  });

  const makeRequest = async (method, endpoint, body = null, requiresAuth = true) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (requiresAuth && authToken) {
      headers['Authorization'] = authToken;
    }
    
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || response.statusText);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Authentication functions
  const register = async () => {
    try {
      const { regUsername, regPassword, regEmail } = formData;
      const result = await makeRequest('POST', '/auth/register', {
        username: regUsername,
        password: regPassword,
        email: regEmail
      }, false);
      
      setResults(prev => ({ ...prev, registerResult: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ ...prev, registerResult: { success: false, error: error.message } }));
    }
  };

  const login = async () => {
    try {
      const { loginUsername, loginPassword } = formData;
      const result = await makeRequest('POST', '/auth/login', {
        username: loginUsername,
        password: loginPassword
      }, false);
      
      setAuthToken(result.token);
      localStorage.setItem('authToken', result.token);
      setResults(prev => ({ ...prev, loginResult: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ ...prev, loginResult: { success: false, error: error.message } }));
    }
  };

  const getCurrentUser = async () => {
    try {
      const result = await makeRequest('GET', '/auth/me');
      setResults(prev => ({ ...prev, currentUserResult: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ ...prev, currentUserResult: { success: false, error: error.message } }));
    }
  };

  // Item functions
  const createItem = async () => {
    try {
      const { itemName, itemDescription } = formData;
      const result = await makeRequest('POST', '/items', {
        name: itemName,
        description: itemDescription
      });
      
      setResults(prev => ({ ...prev, createItemResult: { success: true, data: result } }));
      setFormData(prev => ({ 
        ...prev, 
        itemId: result.id,
        reviewItemId: result.id,
        reviewsByItemId: result.id
      }));
    } catch (error) {
      setResults(prev => ({ ...prev, createItemResult: { success: false, error: error.message } }));
    }
  };

  const getAllItems = async () => {
    try {
      const result = await makeRequest('GET', '/items');
      setResults(prev => ({ ...prev, allItemsResult: { success: true, data: result } }));
      
      if (result.length > 0) {
        setFormData(prev => ({
          ...prev,
          itemId: result[0].id,
          reviewItemId: result[0].id,
          reviewsByItemId: result[0].id
        }));
      }
    } catch (error) {
      setResults(prev => ({ ...prev, allItemsResult: { success: false, error: error.message } }));
    }
  };

  const getItemById = async () => {
    try {
      const result = await makeRequest('GET', `/items/${formData.itemId}`);
      setResults(prev => ({ ...prev, itemByIdResult: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ ...prev, itemByIdResult: { success: false, error: error.message } }));
    }
  };

  // Review functions
  const createReview = async () => {
    try {
      const { reviewItemId, reviewText, reviewRating } = formData;
      const user = await makeRequest('GET', '/auth/me');
      
      const result = await makeRequest('POST', `/items/${reviewItemId}/reviews`, {
        review_text: reviewText,
        rating: reviewRating,
        user_id: user.id
      });
      
      setResults(prev => ({ ...prev, createReviewResult: { success: true, data: result } }));
      setFormData(prev => ({ ...prev, commentReviewId: result.id }));
    } catch (error) {
      setResults(prev => ({ ...prev, createReviewResult: { success: false, error: error.message } }));
    }
  };

  const getReviewsByItem = async () => {
    try {
      const result = await makeRequest('GET', `/items/${formData.reviewsByItemId}/reviews`);
      setResults(prev => ({ ...prev, reviewsByItemResult: { success: true, data: result } }));
      
      if (result.length > 0) {
        setFormData(prev => ({ ...prev, commentReviewId: result[0].id }));
      }
    } catch (error) {
      setResults(prev => ({ ...prev, reviewsByItemResult: { success: false, error: error.message } }));
    }
  };

  const getReviewsByUser = async () => {
    try {
      const result = await makeRequest('GET', `/users/${formData.reviewsByUserId}/reviews`);
      setResults(prev => ({ ...prev, reviewsByUserResult: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ ...prev, reviewsByUserResult: { success: false, error: error.message } }));
    }
  };

  // Comment functions
  const createComment = async () => {
    try {
      const { commentReviewId, commentText } = formData;
      const user = await makeRequest('GET', '/auth/me');
      
      const result = await makeRequest('POST', `/items/1/reviews/${commentReviewId}/comments`, {
        review_id: commentReviewId,
        user_id: user.id,
        comment_text: commentText
      });
      
      setResults(prev => ({ ...prev, createCommentResult: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ ...prev, createCommentResult: { success: false, error: error.message } }));
    }
  };

  const getCommentsByUser = async () => {
    try {
      const result = await makeRequest('GET', `/users/${formData.commentsByUserId}/comments`);
      setResults(prev => ({ ...prev, commentsByUserResult: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ ...prev, commentsByUserResult: { success: false, error: error.message } }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (authToken) {
      getCurrentUser();
    }
    getAllItems();
  }, [authToken]);

  const renderResult = (resultKey) => {
    const result = results[resultKey];
    if (!result) return null;
    
    return (
      <pre className={result.success ? 'success' : 'error'}>
        {result.success 
          ? JSON.stringify(result.data, null, 2)
          : `Error: ${result.error}`}
      </pre>
    );
  };

  return (
    <div className="content-card">
      <h1>Backend API Tester</h1>
      
      <div className="auth-token">
        <h3>Authentication Token:</h3>
        <div>{authToken || 'Not logged in'}</div>
      </div>

      <div className="feature-grid">
        {/* Authentication Section */}
        
          
          <div className="feature-card">
          <h2>Authentication</h2>
          <h3>Register</h3>
          <input type="text" name="regUsername" value={formData.regUsername} onChange={handleChange} placeholder="Username" />
          <input type="password" name="regPassword" value={formData.regPassword} onChange={handleChange} placeholder="Password" />
          <input type="email" name="regEmail" value={formData.regEmail} onChange={handleChange} placeholder="Email" />
          <button className ="button primary-btn" onClick={register}>Register</button>
          {renderResult('registerResult')}
          
          <h3>Login</h3>
          <input type="text" name="loginUsername" value={formData.loginUsername} onChange={handleChange} placeholder="Username" />
          <input type="password" name="loginPassword" value={formData.loginPassword} onChange={handleChange} placeholder="Password" />
          <button className ="button primary-btn" onClick={login}>Login</button>
          {renderResult('loginResult')}
          
          <h3>Get Current User</h3>
          <button className ="button primary-btn" onClick={getCurrentUser}>Get My Info</button>
          {renderResult('currentUserResult')}
        </div>

        {/* Items Section */}
        
          
          <div className="feature-card">
          <h2>Items</h2>
          <h3>Create Item</h3>
          <input type="text" name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Name" />
          <textarea name="itemDescription" value={formData.itemDescription} onChange={handleChange} placeholder="Description" />
          <button className ="button primary-btn" onClick={createItem}>Create Item</button>
          {renderResult('createItemResult')}
          
          <h3>Get All Items</h3>
          <button className ="button primary-btn" onClick={getAllItems}>Get Items</button>
          {renderResult('allItemsResult')}
          
          <h3>Get Item by ID</h3>
          <input type="text" name="itemId" value={formData.itemId} onChange={handleChange} placeholder="Item ID" />
          <button className ="button primary-btn" onClick={getItemById}>Get Item</button>
          {renderResult('itemByIdResult')}
        </div>

        {/* Reviews Section */}
        
          
          <div className="feature-card">
          <h2>Reviews</h2>
          <h3>Create Review</h3>
          <input type="text" name="reviewItemId" value={formData.reviewItemId} onChange={handleChange} placeholder="Item ID" /><br />
          <textarea name="reviewText" value={formData.reviewText} onChange={handleChange} placeholder="Review Text" /><br />
          <input type="number" name="reviewRating" value={formData.reviewRating} onChange={handleChange} placeholder="Rating (1-5)" min="1" max="5" /><br />
          <button className ="button primary-btn" onClick={createReview}>Create Review</button>
          {renderResult('createReviewResult')}
          
          <h3>Get Reviews by Item</h3>
          <input type="text" name="reviewsByItemId" value={formData.reviewsByItemId} onChange={handleChange} placeholder="Item ID" />
          <button className ="button primary-btn" onClick={getReviewsByItem}>Get Reviews</button>
          {renderResult('reviewsByItemResult')}
          
          <h3>Get Reviews by User</h3>
          <input type="text" name="reviewsByUserId" value={formData.reviewsByUserId} onChange={handleChange} placeholder="User ID" />
          <button className ="button primary-btn" onClick={getReviewsByUser}>Get Reviews</button>
          {renderResult('reviewsByUserResult')}
        </div>

        {/* Comments Section */}
        
          
          <div className="feature-card">
          <h2>Comments</h2>
          <h3>Create Comment</h3>
          <input type="text" name="commentReviewId" value={formData.commentReviewId} onChange={handleChange} placeholder="Review ID" /><br />
          <textarea name="commentText" value={formData.commentText} onChange={handleChange} placeholder="Comment Text" /><br />
          <button className ="button primary-btn" onClick={createComment}>Create Comment</button>
          {renderResult('createCommentResult')}
          
          <h3>Get Comments by User</h3>
          <input type="text" name="commentsByUserId" value={formData.commentsByUserId} onChange={handleChange} placeholder="User ID" />
          <button className ="button primary-btn" onClick={getCommentsByUser}>Get Comments</button>
          {renderResult('commentsByUserResult')}
        </div>
      </div>
    </div>
  );
};

export default APITester;