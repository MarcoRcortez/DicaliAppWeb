package bo.edu.dicali.recruitment.repository;

import bo.edu.dicali.recruitment.model.UserModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<UserModel, String> {
    Optional<UserModel> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(String role);
}
