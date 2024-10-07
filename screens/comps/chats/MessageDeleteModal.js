import { StyleSheet, Modal, View, Text, Pressable } from "react-native";
import * as Animatable from "react-native-animatable";


export const MessageDeleteModal = ({ visible, onClose, onDelete }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View
          animation="zoomIn"
          duration={300}
          style={styles.deleteMessageModalContainer}
        >
          <Text style={styles.modalTitle}>Delete Message</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to delete this message?
          </Text>

          <View style={styles.modalButtons}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={() => {
                onDelete();
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </Pressable>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  deleteMessageModalContainer: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "gray",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
