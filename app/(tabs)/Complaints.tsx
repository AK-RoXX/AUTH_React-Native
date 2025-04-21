import { useState } from 'react';
import { StyleSheet, Image, TextInput, TouchableOpacity, View, Text, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, storage, auth } from '../../lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeIn, FadeOut, withSpring } from 'react-native-reanimated'; // Reanimated imports

export default function TabTwoScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return alert("Permission to access gallery is required!");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return alert("Permission to access camera is required!");

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${Date.now()}.jpg`;
    const imageRef = ref(storage, `complaints/${filename}`);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleSubmit = async () => {
    if (!title || !description || !imageUri) {
      Alert.alert("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImageAsync(imageUri);

      await addDoc(collection(db, 'complaints'), {
        title,
        description,
        imageUrl,
        createdAt: Timestamp.now(),
        userId: auth.currentUser?.uid || 'anonymous'
      });

      Alert.alert("Complaint submitted successfully");
      setTitle('');
      setDescription('');
      setImageUri(null);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.gradient}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.card}>
          <Text style={styles.heading}>📝 Create a Complaint</Text>

          <TextInput
            placeholder="Complaint Title"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            placeholder="Write your complaint..."
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
              <Text style={styles.imageBtnText}>📁 Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
              <Text style={styles.imageBtnText}>📷 Camera</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <Animated.Image
              source={{ uri: imageUri }}
              style={[styles.imagePreview, { transform: [{ scale: withSpring(1.05) }] }]}
              entering={FadeIn}
              exiting={FadeOut}
            />
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}> Submit Complaint</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageBtn: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  imageBtnText: {
    color: '#333',
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
