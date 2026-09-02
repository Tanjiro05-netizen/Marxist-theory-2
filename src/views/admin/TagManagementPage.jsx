import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash, Tag, Folder, Check, X } from 'lucide-react';

const TagManagementPage = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    // State for inline editing
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    // State for Tags
    const [tags, setTags] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [editingTagId, setEditingTagId] = useState(null);
    const [editingTagName, setEditingTagName] = useState('');

    // State for deleting confirmation
    const [deletingTagId, setDeletingTagId] = useState(null);

    // Define fetchCategories outside useEffect so it can be called from other functions
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('theory_categories')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw error;
            setCategories(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCategories();

        const fetchTags = async () => {
            try {
                const { data, error } = await supabase
                    .from('theory_tags')
                    .select('*')
                    .order('name', { ascending: true });
                if (error) throw error;
                setTags(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchTags();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            const { data, error } = await supabase
                .from('theory_categories')
                .insert({ name: newCategoryName.trim() })
                .select()
                .single();
            
            if (error) throw error;

            setCategories([...categories, data]);
            setNewCategoryName('');
        } catch (err) {
            alert(`Error adding category: ${err.message}`);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category? This might affect existing articles.')) return;

        try {
            const { error } = await supabase
                .from('theory_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCategories(categories.filter(c => c.id !== id));
        } catch (err) {
            alert(`Error deleting category: ${err.message}`);
        }
    };

    // --- Edit Category Logic ---
    const handleStartEdit = (id, currentName) => {
        setEditingCategoryId(id);
        setEditingCategoryName(currentName);
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        console.log('Submitting edit for category:', editingCategoryId, 'with new name:', editingCategoryName);
        if (!editingCategoryName.trim() || !editingCategoryId) return;

        try {
            console.log('Sending update to Supabase...');
            // First try to update without .single() to avoid PGRST116 error
            const { data, error } = await supabase
                .from('theory_categories')
                .update({ name: editingCategoryName.trim() })
                .eq('id', editingCategoryId)
                .select();

            console.log('Supabase response:', { data, error });
            
            if (error) throw error;

            // Even if we don't get a direct response, update the UI
            // Create a local updated category object
            const updatedCategory = {
                id: editingCategoryId,
                name: editingCategoryName.trim()
            };
            
            console.log('Updating local state with new category data');
            setCategories(categories.map(c => (c.id === editingCategoryId ? updatedCategory : c)));
            handleCancelEdit();
            
            // Force refresh categories from server
            fetchCategories();
        } catch (err) {
            console.error('Error updating category:', err);
            alert(`Error updating category: ${err.message}`);
        }
    };

    // --- Tag Management Logic ---
    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        try {
            const { data, error } = await supabase
                .from('theory_tags')
                .insert({ name: newTagName.trim() })
                .select()
                .single();
            if (error) throw error;
            setTags([...tags, data]);
            setNewTagName('');
        } catch (err) {
            alert(`Error adding tag: ${err.message}`);
        }
    };

    const handleDeleteTag = async (id) => {
        try {
            const { error } = await supabase.from('theory_tags').delete().eq('id', id);
            if (error) throw error;
            setTags(tags.filter(t => t.id !== id));
        } catch (err) {
            alert(`Error deleting tag: ${err.message}`);
        } finally {
            setDeletingTagId(null);
        }
    };

    const handleStartEditTag = (id, currentName) => {
        setEditingTagId(id);
        setEditingTagName(currentName);
    };

    const handleCancelEditTag = () => {
        setEditingTagId(null);
        setEditingTagName('');
    };

    const handleUpdateTag = async (e) => {
        e.preventDefault();
        if (!editingTagName.trim() || !editingTagId) return;
        try {
            const { data: updatedTag, error } = await supabase
                .from('theory_tags')
                .update({ name: editingTagName.trim() })
                .eq('id', editingTagId)
                .select()
                .single();
            if (error) throw error;
            setTags(tags.map(t => (t.id === editingTagId ? updatedTag : t)));
            handleCancelEditTag();
        } catch (err) {
            alert(`Error updating tag: ${err.message}`);
        }
    };

    if (loading) return <div className="bg-gray-900 min-h-screen text-white p-8">Loading...</div>;
    if (error) return <div className="bg-gray-900 min-h-screen text-white p-8">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">Manage Categories & Tags</h1>

                {/* Categories Section */}
                <div className="bg-gray-800/50 p-6 rounded-none">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center"><Folder className="mr-3"/>Categories</h2>
                    
                    <form onSubmit={handleAddCategory} className="flex gap-4 mb-6">
                        <input 
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="New category name"
                            className="flex-grow bg-gray-900/70 border border-gray-700 rounded-none px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-none flex items-center">
                            <Plus size={18} className="mr-2"/> Add
                        </button>
                    </form>

                    <div className="space-y-3">
                        {categories.map(category => (
                            <div key={category.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-none">
                                {editingCategoryId === category.id ? (
                                    <form onSubmit={handleUpdateCategory} className="flex-grow flex items-center gap-4">
                                        <input
                                            type="text"
                                            value={editingCategoryName}
                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                            className="flex-grow bg-gray-700 border border-gray-600 rounded-none px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Escape' && handleCancelEdit()}
                                        />
                                        <button type="submit" className="text-green-400 hover:text-white p-1"><Check size={20}/></button>
                                        <button type="button" onClick={handleCancelEdit} className="text-gray-400 hover:text-white p-1"><X size={20}/></button>
                                    </form>
                                ) : (
                                    <>
                                        <span className="font-medium">{category.name}</span>
                                        <div className="flex gap-4">
                                            <button onClick={() => handleStartEdit(category.id, category.name)} className="text-gray-400 hover:text-white"><Edit size={18}/></button>
                                            <button onClick={() => handleDeleteCategory(category.id)} className="text-gray-400 hover:text-red-500"><Trash size={18}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tags Section */}
                <div className="bg-gray-800/50 p-6 rounded-none mt-8">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center"><Tag className="mr-3"/>Tags</h2>
                    
                    <form onSubmit={handleAddTag} className="flex gap-4 mb-6">
                        <input 
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag name"
                            className="flex-grow bg-gray-900/70 border border-gray-700 rounded-none px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-none flex items-center">
                            <Plus size={18} className="mr-2"/> Add
                        </button>
                    </form>

                    <div className="space-y-3">
                        {tags.map(tag => (
                            <div key={tag.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-none">
                                {deletingTagId === tag.id ? (
                                    <div className="flex-grow flex items-center justify-between">
                                        <span className="text-red-400 font-semibold">Are you sure?</span>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleDeleteTag(tag.id)} className="text-green-400 hover:text-white p-1"><Check size={20}/></button>
                                            <button onClick={() => setDeletingTagId(null)} className="text-red-400 hover:text-white p-1"><X size={20}/></button>
                                        </div>
                                    </div>
                                ) : editingTagId === tag.id ? (
                                    <form onSubmit={handleUpdateTag} className="flex-grow flex items-center gap-4">
                                        <input
                                            type="text"
                                            value={editingTagName}
                                            onChange={(e) => setEditingTagName(e.target.value)}
                                            className="flex-grow bg-gray-700 border border-gray-600 rounded-none px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Escape' && handleCancelEditTag()}
                                        />
                                        <button type="submit" className="text-green-400 hover:text-white p-1"><Check size={20}/></button>
                                        <button type="button" onClick={handleCancelEditTag} className="text-gray-400 hover:text-white p-1"><X size={20}/></button>
                                    </form>
                                ) : (
                                    <>
                                        <span className="font-medium">{tag.name}</span>
                                        <div className="flex gap-4">
                                            <button onClick={() => handleStartEditTag(tag.id, tag.name)} className="text-gray-400 hover:text-white"><Edit size={18}/></button>
                                            <button onClick={() => setDeletingTagId(tag.id)} className="text-gray-400 hover:text-red-500"><Trash size={18}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TagManagementPage;
